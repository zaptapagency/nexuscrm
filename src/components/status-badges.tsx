import { Badge } from "@/components/ui/badge";
import {
  LIFECYCLE_LABELS,
  DEAL_STAGE_LABELS,
  TICKET_STATUS_LABELS,
  type LifecycleStage,
  type DealStage,
  type TicketStatus,
} from "@/lib/constants";

type Variant = "default" | "secondary" | "destructive" | "success" | "warning" | "outline";

const LIFECYCLE_VARIANT: Record<string, Variant> = {
  LEAD: "secondary",
  MQL: "default",
  SQL: "warning",
  OPPORTUNITY: "warning",
  CUSTOMER: "success",
};

export function LifecycleBadge({ stage }: { stage: string }) {
  return (
    <Badge variant={LIFECYCLE_VARIANT[stage] ?? "secondary"}>
      {LIFECYCLE_LABELS[stage as LifecycleStage] ?? stage}
    </Badge>
  );
}

const DEAL_VARIANT: Record<string, Variant> = {
  PROSPECTING: "secondary",
  QUALIFIED: "default",
  PROPOSAL: "warning",
  NEGOTIATION: "warning",
  CLOSED_WON: "success",
  CLOSED_LOST: "destructive",
};

export function DealStageBadge({ stage }: { stage: string }) {
  return (
    <Badge variant={DEAL_VARIANT[stage] ?? "secondary"}>
      {DEAL_STAGE_LABELS[stage as DealStage] ?? stage}
    </Badge>
  );
}

const TICKET_VARIANT: Record<string, Variant> = {
  NEW: "default",
  OPEN: "warning",
  WAITING: "secondary",
  RESOLVED: "success",
  CLOSED: "outline",
};

export function TicketStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={TICKET_VARIANT[status] ?? "secondary"}>
      {TICKET_STATUS_LABELS[status as TicketStatus] ?? status}
    </Badge>
  );
}

const PRIORITY_VARIANT: Record<string, Variant> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  URGENT: "destructive",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority] ?? "secondary"}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </Badge>
  );
}
