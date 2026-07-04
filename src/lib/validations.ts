import { z } from "zod";
import {
  ROLES,
  LIFECYCLE_STAGES,
  DEAL_STAGES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  PRIORITIES,
  COMPANY_SIZES,
} from "./constants";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8),
  role: z.enum(ROLES),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  role: z.enum(ROLES).optional(),
  active: z.boolean().optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2),
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color")
    .optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const companySchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  domain: optionalString,
  industry: optionalString,
  size: z.enum(COMPANY_SIZES).optional().or(z.literal("")),
  phone: optionalString,
  city: optionalString,
  country: optionalString,
  website: optionalString,
  ownerId: optionalString,
});
export type CompanyInput = z.infer<typeof companySchema>;

export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  phone: optionalString,
  jobTitle: optionalString,
  lifecycleStage: z.enum(LIFECYCLE_STAGES).default("LEAD"),
  companyId: optionalString,
  ownerId: optionalString,
  source: optionalString,
});
export type ContactInput = z.infer<typeof contactSchema>;

export const dealSchema = z.object({
  name: z.string().trim().min(1, "Deal name is required"),
  amount: z.coerce.number().min(0, "Amount must be positive").default(0),
  stage: z.enum(DEAL_STAGES).default("PROSPECTING"),
  closeDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  contactId: optionalString,
  companyId: optionalString,
  ownerId: optionalString,
});
export type DealInput = z.infer<typeof dealSchema>;

export const dealStageSchema = z.object({
  stage: z.enum(DEAL_STAGES),
  order: z.coerce.number().int().optional(),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: optionalString,
  dueDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  assigneeId: optionalString,
  contactId: optionalString,
  dealId: optionalString,
});
export type TaskInput = z.infer<typeof taskSchema>;

export const ticketSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required"),
  description: optionalString,
  status: z.enum(TICKET_STATUSES).default("NEW"),
  priority: z.enum(TICKET_PRIORITIES).default("MEDIUM"),
  contactId: optionalString,
  assigneeId: optionalString,
});
export type TicketInput = z.infer<typeof ticketSchema>;

export const ticketStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES),
  order: z.coerce.number().int().optional(),
});

export const noteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty"),
  contactId: optionalString,
  dealId: optionalString,
});

export const segmentFilterSchema = z.object({
  lifecycleStage: z.enum(LIFECYCLE_STAGES).optional().or(z.literal("")),
  ownerId: optionalString,
  companyId: optionalString,
  createdAfter: optionalString,
  createdBefore: optionalString,
});
export type SegmentFilters = z.infer<typeof segmentFilterSchema>;

export const segmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: optionalString,
  filters: segmentFilterSchema,
});

export const campaignSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  subject: z.string().trim().min(1, "Subject is required"),
  body: z.string().trim().min(1, "Body is required"),
  fromName: z.string().trim().min(1).default("NexusCRM"),
  segmentId: z.string().trim().min(1, "Select a segment"),
});
export type CampaignInput = z.infer<typeof campaignSchema>;

export const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "email", "textarea", "dropdown", "phone"]),
  label: z.string().trim().min(1),
  placeholder: z.string().optional().default(""),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional().default([]),
  mapsTo: z.enum(["firstName", "lastName", "email", "phone", "jobTitle", "none"]).default("none"),
});
export type FormField = z.infer<typeof formFieldSchema>;

export const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: optionalString,
  submitText: z.string().trim().min(1).default("Submit"),
  successMessage: z.string().trim().min(1).default("Thanks! We'll be in touch soon."),
  published: z.boolean().default(true),
  fields: z.array(formFieldSchema).min(1, "Add at least one field"),
});
export type FormInput = z.infer<typeof formSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().optional().default(""),
  sort: z.string().optional().default("createdAt"),
  dir: z.enum(["asc", "desc"]).optional().default("desc"),
});
