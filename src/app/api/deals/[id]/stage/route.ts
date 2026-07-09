import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { dealStageSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { CLOSED_DEAL_STAGES } from "@/lib/constants";

export const PATCH = withAuth(async (user, req, { params }) => {
  const body = await req.json();
  const { stage, order } = dealStageSchema.parse(body);

  const before = await prisma.deal.findUniqueOrThrow({ where: { id: params.id } });
  const nowClosed = (CLOSED_DEAL_STAGES as readonly string[]).includes(stage);

  const deal = await prisma.deal.update({
    where: { id: params.id },
    data: {
      stage,
      order: order ?? before.order,
      closedAt: nowClosed ? before.closedAt ?? new Date() : null,
    },
  });

  if (stage !== before.stage) {
    await logActivity({
      type: "STAGE_CHANGED",
      message: `Deal stage changed from ${before.stage} to ${stage}`,
      actorId: user.id,
      dealId: deal.id,
      contactId: deal.contactId,
      companyId: deal.companyId,
    });
  }
  return ok(deal);
}, "record:edit");
