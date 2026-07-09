import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { ticketStatusSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { RESOLVED_TICKET_STATUSES } from "@/lib/constants";

export const PATCH = withAuth(async (user, req, { params }) => {
  const body = await req.json();
  const { status, order } = ticketStatusSchema.parse(body);

  const before = await prisma.ticket.findUniqueOrThrow({ where: { id: params.id } });
  const nowResolved = (RESOLVED_TICKET_STATUSES as readonly string[]).includes(status);

  const ticket = await prisma.ticket.update({
    where: { id: params.id },
    data: {
      status,
      order: order ?? before.order,
      resolvedAt: nowResolved ? before.resolvedAt ?? new Date() : null,
    },
  });

  if (status !== before.status) {
    await logActivity({
      type: "TICKET_STATUS",
      message: `Ticket status changed from ${before.status} to ${status}`,
      actorId: user.id,
      ticketId: ticket.id,
      contactId: ticket.contactId,
    });
  }
  return ok(ticket);
}, "record:edit");
