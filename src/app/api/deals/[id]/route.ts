import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { dealSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { CLOSED_DEAL_STAGES } from "@/lib/constants";

export const GET = withAuth(async (_user, _req, { params }) => {
  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: params.id },
    include: { contact: true, company: true, owner: true },
  });
  return ok(deal);
});

export const PATCH = withAuth(async (user, req, { params }) => {
  const body = await req.json();
  const data = dealSchema.partial().parse(body);

  const before = await prisma.deal.findUniqueOrThrow({ where: { id: params.id } });

  const stageChanged = data.stage !== undefined && data.stage !== before.stage;
  const nowClosed = data.stage ? (CLOSED_DEAL_STAGES as readonly string[]).includes(data.stage) : false;

  const deal = await prisma.deal.update({
    where: { id: params.id },
    data: {
      ...data,
      ...(stageChanged ? { closedAt: nowClosed ? new Date() : null } : {}),
    },
  });

  if (stageChanged) {
    await logActivity({
      type: "STAGE_CHANGED",
      message: `Deal stage changed from ${before.stage} to ${data.stage}`,
      actorId: user.id,
      dealId: deal.id,
      contactId: deal.contactId,
      companyId: deal.companyId,
    });
  } else {
    await logActivity({
      type: "UPDATED",
      message: `Deal details updated`,
      actorId: user.id,
      dealId: deal.id,
    });
  }
  return ok(deal);
}, "record:edit");

export const DELETE = withAuth(async (_user, _req, { params }) => {
  await prisma.deal.delete({ where: { id: params.id } });
  return ok({ success: true });
}, "record:delete");
