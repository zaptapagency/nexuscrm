import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { taskSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

const patchSchema = taskSchema.partial().extend({
  completed: z.boolean().optional(),
});

export const PATCH = withAuth(async (user, req, { params }) => {
  const body = await req.json();
  const data = patchSchema.parse(body);

  const before = await prisma.task.findUniqueOrThrow({ where: { id: params.id } });
  const completing = data.completed === true && !before.completed;

  const task = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...data,
      ...(data.completed !== undefined
        ? { completedAt: data.completed ? new Date() : null }
        : {}),
    },
  });

  if (completing) {
    await logActivity({
      type: "TASK_COMPLETED",
      message: `Task "${task.title}" completed`,
      actorId: user.id,
      contactId: task.contactId,
      dealId: task.dealId,
    });
  }
  return ok(task);
}, "record:edit");

export const DELETE = withAuth(async (_user, _req, { params }) => {
  await prisma.task.delete({ where: { id: params.id } });
  return ok({ success: true });
}, "record:delete");
