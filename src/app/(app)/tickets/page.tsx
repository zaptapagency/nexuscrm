import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getContactOptions, getOwnerOptions } from "@/lib/queries";
import { RESOLVED_TICKET_STATUSES } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { TicketsBoard } from "./tickets-board";

export const metadata: Metadata = { title: "Tickets" };

export default async function TicketsPage() {
  const [tickets, contacts, assignees] = await Promise.all([
    prisma.ticket.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    getContactOptions(),
    getOwnerOptions(),
  ]);

  const openCount = tickets.filter(
    (t) => !(RESOLVED_TICKET_STATUSES as readonly string[]).includes(t.status),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        description={`${openCount} open ${openCount === 1 ? "ticket" : "tickets"}.`}
      />
      <TicketsBoard
        initialTickets={tickets.map((t) => ({
          id: t.id,
          subject: t.subject,
          description: t.description,
          status: t.status,
          priority: t.priority,
          contactId: t.contactId,
          assigneeId: t.assigneeId,
          contact: t.contact,
          assignee: t.assignee,
        }))}
        contacts={contacts.map((c) => ({ id: c.id, name: c.name }))}
        assignees={assignees.map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
}
