"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deletePoll } from "@/app/lib/actions/poll-actions";

interface PollDeleteButtonProps {
  pollId: string;
}

/**
 * PollDeleteButton Component
 * 
 * Specialized button component for handling poll deletion with confirmation and loading states.
 * 
 * Features:
 * - User confirmation dialog before deletion (prevents accidental deletion)
 * - Loading state management with visual feedback
 * - Error handling with user-friendly alerts
 * - Automatic page refresh after successful deletion
 * - Disabled state during deletion process
 * 
 * Security considerations:
 * - Uses Server Action for secure deletion
 * - Authorization handled server-side (user/admin permissions)
 * - Button only rendered when user has delete permissions
 * - Server validates ownership before deletion
 * 
 * User experience:
 * - Clear confirmation dialog with warning message
 * - Visual feedback during deletion process
 * - Error messages displayed to user
 * - Destructive button styling (red) to indicate danger
 * 
 * Error handling:
 * - Server-side errors displayed via alert
 * - Network/client errors caught and handled
 * - Loading state properly reset in finally block
 * 
 * @param pollId - The unique identifier of the poll to delete
 */
export default function PollDeleteButton({ pollId }: PollDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Handles poll deletion with confirmation and error handling
   * 
   * Flow:
   * 1. Show confirmation dialog
   * 2. Set loading state
   * 3. Call server action
   * 4. Handle response (error or success)
   * 5. Refresh page or show error
   * 6. Reset loading state
   */
  const handleDelete = async () => {
    // Confirmation dialog to prevent accidental deletion
    if (!confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      // Call server action to delete poll
      const result = await deletePoll(pollId);
      if (result.error) {
        // Show server-side error to user
        alert(`Error: ${result.error}`);
      } else {
        // Refresh page to show updated poll list
        // (Could be replaced with more sophisticated state management)
        window.location.reload();
      }
    } catch (error) {
      // Handle client-side or network errors
      alert("An error occurred while deleting the poll.");
      console.error("Delete error:", error);
    } finally {
      // Always reset loading state
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive" // Red styling indicates destructive action
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting} // Prevent multiple deletion attempts
    >
      {/* Dynamic button text based on loading state */}
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  );
}