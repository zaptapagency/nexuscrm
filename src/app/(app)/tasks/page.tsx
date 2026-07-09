import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOwnerOptions, getContactOptions, getDealOptions } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { TasksClient } from "./tasks-client";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const q = (searchParams.q ?? "").trim();
  const status = searchParams.status ?? "open";
  const priority = searchParams.priority ?? "";
  const assigneeId = searchParams.assigneeId ?? "";

  const where: Prisma.TaskWhereInput = {};
  if (q) where.title = { contains: q };
  if (status === "open") where.completed = false;
  if (status === "done") where.completed = true;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;

  const [tasks, assignees, contacts, deals] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, name: true } },
      },
    }),
    getOwnerOptions(),
    getContactOptions(),
    getDealOptions(),
  ]);

  const openCount = await prisma.task.count({ where: { completed: false } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={`${openCount} open ${openCount === 1 ? "task" : "tasks"}.`}
      />
      <TasksClient
        initialTasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          priority: t.priority,
          completed: t.completed,
          assigneeId: t.assigneeId,
          contactId: t.contactId,
          dealId: t.dealId,
          assignee: t.assignee,
          contact: t.contact,
          deal: t.deal,
        }))}
        assignees={assignees.map((a) => ({ id: a.id, name: a.name }))}
        contacts={contacts.map((c) => ({ id: c.id, name: c.name }))}
        deals={deals}
      />
    </div>
  );
}
