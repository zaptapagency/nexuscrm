import {
  Plus,
  Pencil,
  ArrowRightLeft,
  StickyNote,
  Mail,
  CheckCircle2,
  FileInput,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  CREATED: Plus,
  UPDATED: Pencil,
  STAGE_CHANGED: ArrowRightLeft,
  NOTE_ADDED: StickyNote,
  EMAIL_SENT: Mail,
  TASK_COMPLETED: CheckCircle2,
  FORM_SUBMITTED: FileInput,
  TICKET_STATUS: LifeBuoy,
};

export interface TimelineActivity {
  id: string;
  type: string;
  message: string;
  createdAt: string | Date;
  actor?: { name: string } | null;
}

export function ActivityTimeline({ activities }: { activities: TimelineActivity[] }) {
  if (activities.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ol className="relative space-y-5 pl-2">
      {activities.map((a, idx) => {
        const Icon = ICONS[a.type] ?? Pencil;
        return (
          <li key={a.id} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="h-3.5 w-3.5" />
              </span>
              {idx < activities.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
              )}
            </div>
            <div className={cn("pb-1", idx < activities.length - 1 && "pb-4")}>
              <p className="text-sm">{a.message}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {a.actor?.name ? `${a.actor.name} · ` : ""}
                {relativeTime(a.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
