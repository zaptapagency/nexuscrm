import { prisma } from "./prisma";

interface LogActivityInput {
  type: string;
  message: string;
  actorId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  ticketId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput) {
  return prisma.activity.create({
    data: {
      type: input.type,
      message: input.message,
      actorId: input.actorId ?? null,
      contactId: input.contactId ?? null,
      companyId: input.companyId ?? null,
      dealId: input.dealId ?? null,
      ticketId: input.ticketId ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
