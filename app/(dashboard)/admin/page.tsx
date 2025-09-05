import { redirect } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/lib/actions/auth-actions";
import AdminPollDelete from "./AdminPollDelete";

interface Poll {
  id: string;
  question: string;
  user_id: string;
  created_at: string;
  options: string[];
}

export default async function AdminPage() {
  // Check admin authorization on server side
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  if (!user.app_metadata?.admin) {
    redirect('/polls?error=unauthorized');
  }

  // Fetch polls server-side with admin privileges
  const supabase = await createClient();
  const { data: polls, error } = await supabase
    .from("polls")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error('Failed to fetch polls');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-gray-600 mt-2">
          View and manage all polls in the system.
        </p>
        <p className="text-sm text-blue-600 mt-1">
          Authenticated as admin: {user.email}
        </p>
      </div>

      <div className="grid gap-4">
        {polls?.map((poll) => (
          <Card key={poll.id} className="border-l-4 border-l-red-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{poll.question}</CardTitle>
                  <CardDescription>
                    <div className="space-y-1 mt-2">
                      <div>
                        Created: {new Date(poll.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        Options: {poll.options.length} choices
                      </div>
                    </div>
                  </CardDescription>
                </div>
                <AdminPollDelete pollId={poll.id} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium">Poll Options:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {poll.options.map((option, index) => (
                    <li key={index} className="text-gray-700">
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!polls || polls.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          No polls found in the system.
        </div>
      )}
    </div>
  );
}