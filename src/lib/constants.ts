export const ROLES = ["ADMIN", "MANAGER", "REP"] as const;
export type Role = (typeof ROLES)[number];

export const LIFECYCLE_STAGES = ["LEAD", "MQL", "SQL", "OPPORTUNITY", "CUSTOMER"] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  LEAD: "Lead",
  MQL: "MQL",
  SQL: "SQL",
  OPPORTUNITY: "Opportunity",
  CUSTOMER: "Customer",
};

export const DEAL_STAGES = [
  "PROSPECTING",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  PROSPECTING: "Prospecting",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

export const OPEN_DEAL_STAGES: DealStage[] = [
  "PROSPECTING",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
];

export const CLOSED_DEAL_STAGES: DealStage[] = ["CLOSED_WON", "CLOSED_LOST"];

export const TICKET_STATUSES = ["NEW", "OPEN", "WAITING", "RESOLVED", "CLOSED"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: "New",
  OPEN: "Open",
  WAITING: "Waiting",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const RESOLVED_TICKET_STATUSES = ["RESOLVED", "CLOSED"] as const;

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;

export const INDUSTRIES = [
  "Software",
  "Financial Services",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Education",
  "Marketing",
  "Real Estate",
  "Consulting",
  "Other",
] as const;

export const ACTIVITY_TYPES = [
  "CREATED",
  "UPDATED",
  "STAGE_CHANGED",
  "NOTE_ADDED",
  "EMAIL_SENT",
  "TASK_COMPLETED",
  "FORM_SUBMITTED",
  "TICKET_STATUS",
] as const;

export const PAGE_SIZE = 15;
