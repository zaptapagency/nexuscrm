import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { ticketSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { RESOLVED_TICKET_STATUSES } from "@/lib/constants";

export const GET = withAuth(async (_user, req) => {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const priority = searchParams.get("priority") ?? "";
  const assigneeId = searchParams.get("assigneeId") ?? "";

  const where: Prisma.TicketWhereInput = {};
  if (q) where.subject = { contains: q };
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: {
      assignee: { select: { id: true, name: true, avatarColor: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return ok({ tickets });
});

export const POST = withAuth(async (user, req) => {
  const body = await req.json();
  const data = ticketSchema.parse(body);

  const resolved = (RESOLVED_TICKET_STATUSES as readonly string[]).includes(data.status);
  const ticket = await prisma.ticket.create({
    data: {
      subject: data.subject,
      description: data.description,
      status: data.status,
      priority: data.priority,
      contactId: data.contactId,
      assigneeId: data.assigneeId ?? user.id,
      resolvedAt: resolved ? new Date() : null,
    },
  });
  await logActivity({
    type: "CREATED",
    message: `Ticket "${ticket.subject}" created`,
    actorId: user.id,
    ticketId: ticket.id,
    contactId: ticket.contactId,
  });
  return ok(ticket, 201);
}, "record:create");
