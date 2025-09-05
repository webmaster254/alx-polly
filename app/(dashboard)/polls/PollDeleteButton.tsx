"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deletePoll } from "@/app/lib/actions/poll-actions";

interface PollDeleteButtonProps {
  pollId: string;
}

export default function PollDeleteButton({ pollId }: PollDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const result = await deletePoll(pollId);
      if (result.error) {
        alert(`Error: ${result.error}`);
      } else {
        // Refresh the page to show updated list
        window.location.reload();
      }
    } catch (error) {
      alert("An error occurred while deleting the poll.");
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  );
}