import Link from "next/link";
import { Button } from "@/components/ui/button";
import PollDeleteButton from "./PollDeleteButton";

interface Poll {
  id: string;
  question: string;
  options: any[];
  user_id: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

interface PollActionsProps {
  poll: Poll;
}

export default function PollActions({ poll }: PollActionsProps) {
  return (
    <div className="border rounded-md shadow-md hover:shadow-lg transition-shadow bg-white">
      <Link href={`/polls/${poll.id}`}>
        <div className="group p-4">
          <div className="h-full">
            <div>
              <h2 className="group-hover:text-blue-600 transition-colors font-bold text-lg">
                {poll.question}
              </h2>
              <p className="text-slate-500">{poll.options.length} options</p>
            </div>
          </div>
        </div>
      </Link>
      {(poll.canEdit || poll.canDelete) && (
        <div className="flex gap-2 p-2">
          {poll.canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/polls/${poll.id}/edit`}>Edit</Link>
            </Button>
          )}
          {poll.canDelete && (
            <PollDeleteButton pollId={poll.id} />
          )}
        </div>
      )}
    </div>
  );
}
