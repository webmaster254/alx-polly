import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getUserPolls } from '@/app/lib/actions/poll-actions';
import PollActions from './PollActions'; 

/**
 * PollsPage Component
 * 
 * Dashboard page displaying all polls created by the authenticated user.
 * 
 * Features:
 * - Fetches user-specific polls using Server Actions
 * - Responsive grid layout for poll display
 * - Empty state with call-to-action for new users
 * - Error handling for failed poll fetches
 * - Quick access to poll creation
 * 
 * Security considerations:
 * - Uses server-side authentication to fetch only user's polls
 * - Poll data includes permission context (canEdit, canDelete)
 * - Server-side rendering prevents unauthorized data exposure
 * 
 * Layout:
 * - Header with page title and create button
 * - Responsive grid: 1 column mobile, 2 columns tablet, 3 columns desktop
 * - Empty state spans full grid width with centered content
 * - Error messages displayed below grid
 */
export default async function PollsPage() {
  // Fetch polls for authenticated user (includes permission context)
  const { polls, error } = await getUserPolls();

  return (
    <div className="space-y-6">
      {/* Page Header with Title and Create Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Polls</h1>
        <Button asChild>
          <Link href="/create">Create New Poll</Link>
        </Button>
      </div>
      
      {/* Polls Grid or Empty State */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {polls && polls.length > 0 ? (
          // Render poll cards with action buttons
          polls.map((poll) => <PollActions key={poll.id} poll={poll} />)
        ) : (
          // Empty state for users with no polls
          <div className="flex flex-col items-center justify-center py-12 text-center col-span-full">
            <h2 className="text-xl font-semibold mb-2">No polls yet</h2>
            <p className="text-slate-500 mb-6">Create your first poll to get started</p>
            <Button asChild>
              <Link href="/create">Create New Poll</Link>
            </Button>
          </div>
        )}
      </div>
      
      {/* Error Display */}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
}