import Link from "next/link";
import { Button } from "@/components/ui/button";
import PollDeleteButton from "./PollDeleteButton";

/**
 * Poll data interface with permission context
 */
interface Poll {
  id: string;
  question: string;
  options: any[];
  user_id: string;
  canEdit?: boolean;   // User permission to edit this poll
  canDelete?: boolean; // User permission to delete this poll
}

interface PollActionsProps {
  poll: Poll;
}

/**
 * PollActions Component
 * 
 * Card component displaying a poll summary with context-aware action buttons.
 * 
 * Features:
 * - Clickable card that navigates to poll detail page
 * - Hover effects for better user interaction
 * - Conditional rendering of edit/delete buttons based on permissions
 * - Poll summary showing question and option count
 * - Responsive design with proper spacing
 * 
 * Security considerations:
 * - Action buttons only appear if user has appropriate permissions
 * - Permission context (canEdit, canDelete) is determined server-side
 * - Links use Next.js routing for client-side navigation
 * - Delete functionality delegates to specialized PollDeleteButton component
 * 
 * User experience:
 * - Visual hover feedback on card and title
 * - Clear visual separation between content and actions
 * - Accessible button sizing and placement
 * - Color coding for destructive actions (delete button)
 * 
 * @param poll - Poll object with permission context
 */
export default function PollActions({ poll }: PollActionsProps) {
  return (
    <div className="border rounded-md shadow-md hover:shadow-lg transition-shadow bg-white">
      {/* Main Poll Card (Clickable) */}
      <Link href={`/polls/${poll.id}`}>
        <div className="group p-4">
          <div className="h-full">
            <div>
              {/* Poll Question with Hover Effect */}
              <h2 className="group-hover:text-blue-600 transition-colors font-bold text-lg">
                {poll.question}
              </h2>
              {/* Poll Metadata */}
              <p className="text-slate-500">{poll.options.length} options</p>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Conditional Action Buttons Section */}
      {(poll.canEdit || poll.canDelete) && (
        <div className="flex gap-2 p-2">
          {/* Edit Button - Only shown if user can edit */}
          {poll.canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/polls/${poll.id}/edit`}>Edit</Link>
            </Button>
          )}
          {/* Delete Button - Only shown if user can delete */}
          {poll.canDelete && (
            <PollDeleteButton pollId={poll.id} />
          )}
        </div>
      )}
    </div>
  );
}
