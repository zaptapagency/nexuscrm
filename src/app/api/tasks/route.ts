import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { taskSchema } from "@/lib/validations";

export const GET = withAuth(async (_user, req) => {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const assigneeId = searchParams.get("assigneeId") ?? "";

  const where: Prisma.TaskWhereInput = {};
  if (q) where.title = { contains: q };
  if (status === "open") where.completed = false;
  if (status === "done") where.completed = true;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      assignee: { select: { id: true, name: true, avatarColor: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, name: true } },
    },
  });

  return ok({ tasks });
});

export const POST = withAuth(async (user, req) => {
  const body = await req.json();
  const data = taskSchema.parse(body);
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority,
      assigneeId: data.assigneeId ?? user.id,
      contactId: data.contactId,
      dealId: data.dealId,
    },
  });
  return ok(task, 201);
}, "record:create");
