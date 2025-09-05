"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Input validation
  if (!question || question.trim().length === 0) {
    return { error: "Please provide a valid question." };
  }
  if (options.length < 2) {
    return { error: "Please provide at least two options." };
  }
  if (options.length > 10) {
    return { error: "Maximum 10 options allowed." };
  }
  if (question.length > 500) {
    return { error: "Question must be 500 characters or less." };
  }
  
  // Validate option lengths and content
  for (const option of options) {
    if (option.trim().length === 0) {
      return { error: "All options must be non-empty." };
    }
    if (option.length > 200) {
      return { error: "Each option must be 200 characters or less." };
    }
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question: question.trim(),
      options: options.map(opt => opt.trim()),
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { polls: [], error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  
  // Add user context to each poll
  const pollsWithContext = data?.map(poll => ({
    ...poll,
    canEdit: true, // User owns all their polls
    canDelete: true, // User can delete their own polls
  })) ?? [];
  
  return { polls: pollsWithContext, error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // Get user from session for access control
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  
  // Add user context to poll data
  const pollWithContext = {
    ...data,
    canEdit: user?.id === data.user_id,
    canDelete: user?.id === data.user_id || user?.app_metadata?.admin,
  };
  
  return { poll: pollWithContext, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Require login to vote
  if (userError || !user) {
    return { error: 'You must be logged in to vote.' };
  }

  // Check if user has already voted on this poll
  const { data: existingVote, error: voteCheckError } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .single();
    
  if (voteCheckError && voteCheckError.code !== 'PGRST116') {
    return { error: "Error checking existing votes." };
  }
  
  if (existingVote) {
    return { error: "You have already voted on this poll." };
  }

  // Verify poll exists and is accessible
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("options")
    .eq("id", pollId)
    .single();
    
  if (pollError) {
    return { error: "Poll not found." };
  }
  
  // Validate option index
  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return { error: "Invalid option selected." };
  }

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user.id,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  revalidatePath(`/polls/${pollId}`);
  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to delete a poll." };
  }

  // Check if user owns the poll or is admin
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", id)
    .single();
    
  if (pollError) {
    return { error: "Poll not found." };
  }
  
  // Only allow deletion if user owns the poll or is admin
  if (poll.user_id !== user.id && !user.app_metadata?.admin) {
    return { error: "You can only delete your own polls." };
  }

  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Input validation
  if (!question || question.trim().length === 0) {
    return { error: "Please provide a valid question." };
  }
  if (options.length < 2) {
    return { error: "Please provide at least two options." };
  }
  if (options.length > 10) {
    return { error: "Maximum 10 options allowed." };
  }
  if (question.length > 500) {
    return { error: "Question must be 500 characters or less." };
  }
  
  // Validate option lengths
  for (const option of options) {
    if (option.trim().length === 0) {
      return { error: "All options must be non-empty." };
    }
    if (option.length > 200) {
      return { error: "Each option must be 200 characters or less." };
    }
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Check ownership before updating
  const { data: existingPoll, error: pollError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", pollId)
    .single();
    
  if (pollError) {
    return { error: "Poll not found." };
  }
  
  if (existingPoll.user_id !== user.id) {
    return { error: "You can only update your own polls." };
  }

  // Update the poll
  const { error } = await supabase
    .from("polls")
    .update({ 
      question: question.trim(), 
      options: options.map(opt => opt.trim()),
      updated_at: new Date().toISOString()
    })
    .eq("id", pollId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/polls/${pollId}`);
  return { error: null };
}
