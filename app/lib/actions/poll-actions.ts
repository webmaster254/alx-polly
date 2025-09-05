"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Creates a new poll with validation and user authentication
 * 
 * This server action handles poll creation by:
 * - Extracting form data (question and options)
 * - Performing comprehensive input validation
 * - Verifying user authentication
 * - Inserting the poll into the database
 * - Revalidating the polls page cache
 * 
 * @param formData - FormData object containing question and options
 * @returns Object with error message if creation fails, null error if successful
 * 
 * Security considerations:
 * - Requires user authentication to prevent anonymous poll creation
 * - Input sanitization with length limits to prevent abuse
 * - Server-side validation prevents malicious client-side bypasses
 * - Uses parameterized queries to prevent SQL injection
 * 
 * Validation rules:
 * - Question: 1-500 characters, non-empty after trimming
 * - Options: 2-10 items, each 1-200 characters, non-empty after trimming
 */
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  // Extract poll data from form submission
  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Validate question input
  if (!question || question.trim().length === 0) {
    return { error: "Please provide a valid question." };
  }
  if (question.length > 500) {
    return { error: "Question must be 500 characters or less." };
  }
  
  // Validate options array
  if (options.length < 2) {
    return { error: "Please provide at least two options." };
  }
  if (options.length > 10) {
    return { error: "Maximum 10 options allowed." };
  }
  
  // Validate individual option content and length
  for (const option of options) {
    if (option.trim().length === 0) {
      return { error: "All options must be non-empty." };
    }
    if (option.length > 200) {
      return { error: "Each option must be 200 characters or less." };
    }
  }

  // Authenticate user and verify session
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

  // Insert poll into database with user ownership
  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id, // Associate poll with authenticated user
      question: question.trim(), // Clean whitespace
      options: options.map(opt => opt.trim()), // Clean all option whitespace
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  // Revalidate cache to show new poll immediately
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Retrieves all polls created by the current authenticated user
 * 
 * This server action fetches user-specific polls by:
 * - Verifying user authentication
 * - Querying polls table filtered by user_id
 * - Adding context flags for UI permissions
 * - Ordering results by creation date (newest first)
 * 
 * @returns Object containing polls array and error status
 * 
 * Security considerations:
 * - Only returns polls owned by the authenticated user
 * - Row-level security enforced through user_id filtering
 * - Authentication required to prevent unauthorized access
 * - Context flags help UI show appropriate actions
 */
export async function getUserPolls() {
  const supabase = await createClient();
  
  // Verify user authentication before proceeding
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { polls: [], error: "Not authenticated" };
  }

  // Query polls owned by the authenticated user
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id) // Filter by ownership
    .order("created_at", { ascending: false }); // Newest first

  if (error) return { polls: [], error: error.message };
  
  // Enhance poll data with user permission context for UI
  const pollsWithContext = data?.map(poll => ({
    ...poll,
    canEdit: true, // User owns all their polls - can edit
    canDelete: true, // User can delete their own polls
  })) ?? [];
  
  return { polls: pollsWithContext, error: null };
}

/**
 * Retrieves a specific poll by ID with user permission context
 * 
 * This server action fetches a single poll by:
 * - Querying the polls table for the specified ID
 * - Retrieving current user session for permission checks
 * - Adding context flags for edit/delete permissions
 * - Applying admin privileges for delete operations
 * 
 * @param id - The unique identifier of the poll to retrieve
 * @returns Object containing poll data with permissions and error status
 * 
 * Security considerations:
 * - No direct access control on poll viewing (polls are public)
 * - Edit permissions limited to poll owners only
 * - Delete permissions for owners and admins
 * - Admin status checked via app_metadata for privilege escalation
 */
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // Get current user session for permission context (optional for viewing)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  // Fetch the requested poll by ID
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single(); // Expect exactly one result

  if (error) return { poll: null, error: error.message };
  
  // Enhance poll data with user permission context for UI
  const pollWithContext = {
    ...data,
    canEdit: user?.id === data.user_id, // Only poll owner can edit
    canDelete: user?.id === data.user_id || user?.app_metadata?.admin, // Owner or admin can delete
  };
  
  return { poll: pollWithContext, error: null };
}

/**
 * Submits a vote for a specific poll option
 * 
 * This server action handles voting by:
 * - Authenticating the user to prevent anonymous voting
 * - Checking for duplicate votes to maintain one-vote-per-user policy
 * - Validating the poll exists and option index is valid
 * - Recording the vote in the votes table
 * - Revalidating the poll page cache to show updated results
 * 
 * @param pollId - The unique identifier of the poll being voted on
 * @param optionIndex - The zero-based index of the selected option
 * @returns Object with error message if vote fails, null error if successful
 * 
 * Security considerations:
 * - Requires user authentication to prevent ballot stuffing
 * - Duplicate vote prevention maintains voting integrity
 * - Option index validation prevents invalid data injection
 * - Database constraints ensure referential integrity
 * 
 * Business logic:
 * - One vote per user per poll (enforced at database and application level)
 * - Votes are immutable once submitted (no vote changing)
 * - Option indices are validated against the poll's options array
 */
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  
  // Authenticate user - voting requires login
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'You must be logged in to vote.' };
  }

  // Check for existing vote to prevent duplicate voting
  const { data: existingVote, error: voteCheckError } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .single();
    
  // Handle query errors (PGRST116 = no rows returned, which is expected for new votes)
  if (voteCheckError && voteCheckError.code !== 'PGRST116') {
    return { error: "Error checking existing votes." };
  }
  
  // Reject duplicate votes to maintain voting integrity
  if (existingVote) {
    return { error: "You have already voted on this poll." };
  }

  // Verify poll exists and get options for validation
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("options")
    .eq("id", pollId)
    .single();
    
  if (pollError) {
    return { error: "Poll not found." };
  }
  
  // Validate selected option index against available options
  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return { error: "Invalid option selected." };
  }

  // Record the vote in the database
  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user.id,
      option_index: optionIndex, // Store which option was selected
    },
  ]);

  if (error) return { error: error.message };
  
  // Refresh the poll page to show updated vote counts
  revalidatePath(`/polls/${pollId}`);
  return { error: null };
}

/**
 * Deletes a poll with proper authorization checks
 * 
 * This server action handles poll deletion by:
 * - Authenticating the user
 * - Verifying poll ownership or admin privileges
 * - Performing the deletion operation
 * - Revalidating the polls page cache
 * 
 * @param id - The unique identifier of the poll to delete
 * @returns Object with error message if deletion fails, null error if successful
 * 
 * Security considerations:
 * - Requires user authentication to prevent unauthorized deletions
 * - Ownership verification prevents users from deleting others' polls
 * - Admin privilege escalation allows admins to delete any poll
 * - Database foreign key constraints handle related vote cleanup
 * 
 * Authorization rules:
 * - Poll owners can delete their own polls
 * - Users with admin app_metadata can delete any poll
 * - All other users are denied deletion access
 */
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // Authenticate user - deletion requires login
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

  // Fetch poll to verify existence and check ownership
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", id)
    .single();
    
  if (pollError) {
    return { error: "Poll not found." };
  }
  
  // Authorization check: only owner or admin can delete
  if (poll.user_id !== user.id && !user.app_metadata?.admin) {
    return { error: "You can only delete your own polls." };
  }

  // Perform the deletion (related votes are handled by database constraints)
  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: error.message };
  
  // Refresh polls page to remove deleted poll from UI
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Updates an existing poll with validation and authorization
 * 
 * This server action handles poll updates by:
 * - Extracting and validating form data (question and options)
 * - Authenticating the user and verifying poll ownership
 * - Updating the poll in the database with a new timestamp
 * - Revalidating the poll page cache
 * 
 * @param pollId - The unique identifier of the poll to update
 * @param formData - FormData containing the updated question and options
 * @returns Object with error message if update fails, null error if successful
 * 
 * Security considerations:
 * - Requires user authentication to prevent unauthorized updates
 * - Ownership verification prevents users from editing others' polls
 * - Input validation prevents malicious content injection
 * - Server-side validation cannot be bypassed by client modifications
 * 
 * Business logic:
 * - Only poll owners can edit their polls (no admin override for editing)
 * - Updates preserve vote history but may affect vote display
 * - Timestamp updated to track modification history
 * 
 * Validation rules (same as createPoll):
 * - Question: 1-500 characters, non-empty after trimming
 * - Options: 2-10 items, each 1-200 characters, non-empty after trimming
 */
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  // Extract updated poll data from form
  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Validate question input (same rules as creation)
  if (!question || question.trim().length === 0) {
    return { error: "Please provide a valid question." };
  }
  if (question.length > 500) {
    return { error: "Question must be 500 characters or less." };
  }
  
  // Validate options array (same rules as creation)
  if (options.length < 2) {
    return { error: "Please provide at least two options." };
  }
  if (options.length > 10) {
    return { error: "Maximum 10 options allowed." };
  }
  
  // Validate individual option content and length
  for (const option of options) {
    if (option.trim().length === 0) {
      return { error: "All options must be non-empty." };
    }
    if (option.length > 200) {
      return { error: "Each option must be 200 characters or less." };
    }
  }

  // Authenticate user - editing requires login
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

  // Verify poll exists and check ownership
  const { data: existingPoll, error: pollError } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", pollId)
    .single();
    
  if (pollError) {
    return { error: "Poll not found." };
  }
  
  // Only poll owner can edit (stricter than delete which allows admin)
  if (existingPoll.user_id !== user.id) {
    return { error: "You can only update your own polls." };
  }

  // Update the poll with sanitized data and new timestamp
  const { error } = await supabase
    .from("polls")
    .update({ 
      question: question.trim(), // Clean whitespace
      options: options.map(opt => opt.trim()), // Clean all option whitespace
      updated_at: new Date().toISOString() // Track modification time
    })
    .eq("id", pollId);

  if (error) {
    return { error: error.message };
  }

  // Refresh the specific poll page to show updates
  revalidatePath(`/polls/${pollId}`);
  return { error: null };
}
