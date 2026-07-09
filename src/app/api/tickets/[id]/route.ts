import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { ticketSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { RESOLVED_TICKET_STATUSES } from "@/lib/constants";

export const PATCH = withAuth(async (user, req, { params }) => {
  const body = await req.json();
  const data = ticketSchema.partial().parse(body);

  const before = await prisma.ticket.findUniqueOrThrow({ where: { id: params.id } });
  const statusChanged = data.status !== undefined && data.status !== before.status;
  const nowResolved = data.status
    ? (RESOLVED_TICKET_STATUSES as readonly string[]).includes(data.status)
    : false;

  const ticket = await prisma.ticket.update({
    where: { id: params.id },
    data: {
      ...data,
      ...(statusChanged ? { resolvedAt: nowResolved ? before.resolvedAt ?? new Date() : null } : {}),
    },
  });

  if (statusChanged) {
    await logActivity({
      type: "TICKET_STATUS",
      message: `Ticket status changed from ${before.status} to ${data.status}`,
      actorId: user.id,
      ticketId: ticket.id,
      contactId: ticket.contactId,
    });
  }
  return ok(ticket);
}, "record:edit");

export const DELETE = withAuth(async (_user, _req, { params }) => {
  await prisma.ticket.delete({ where: { id: params.id } });
  return ok({ success: true });
}, "record:delete");
