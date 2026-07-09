import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { contactSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export const GET = withAuth(async (_user, _req, { params }) => {
  const contact = await prisma.contact.findUniqueOrThrow({
    where: { id: params.id },
    include: { company: true, owner: true },
  });
  return ok(contact);
});

export const PATCH = withAuth(async (user, req, { params }) => {
  const body = await req.json();
  const data = contactSchema.partial().parse(body);

  const before = await prisma.contact.findUniqueOrThrow({ where: { id: params.id } });
  const contact = await prisma.contact.update({ where: { id: params.id }, data });

  if (data.lifecycleStage && data.lifecycleStage !== before.lifecycleStage) {
    await logActivity({
      type: "STAGE_CHANGED",
      message: `Lifecycle stage changed from ${before.lifecycleStage} to ${data.lifecycleStage}`,
      actorId: user.id,
      contactId: contact.id,
    });
  } else {
    await logActivity({
      type: "UPDATED",
      message: `Contact details updated`,
      actorId: user.id,
      contactId: contact.id,
    });
  }
  return ok(contact);
}, "record:edit");

export const DELETE = withAuth(async (_user, _req, { params }) => {
  await prisma.contact.delete({ where: { id: params.id } });
  return ok({ success: true });
}, "record:delete");
