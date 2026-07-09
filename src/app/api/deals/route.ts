import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { dealSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { CLOSED_DEAL_STAGES } from "@/lib/constants";

export const GET = withAuth(async (_user, req) => {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const ownerId = searchParams.get("ownerId") ?? "";

  const where: Prisma.DealWhereInput = {};
  if (q) where.name = { contains: q };
  if (ownerId) where.ownerId = ownerId;

  const deals = await prisma.deal.findMany({
    where,
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      company: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, avatarColor: true } },
    },
  });

  return ok({ deals });
});

export const POST = withAuth(async (user, req) => {
  const body = await req.json();
  const data = dealSchema.parse(body);

  const closed = (CLOSED_DEAL_STAGES as readonly string[]).includes(data.stage);
  const deal = await prisma.deal.create({
    data: {
      name: data.name,
      amount: data.amount,
      stage: data.stage,
      closeDate: data.closeDate,
      contactId: data.contactId,
      companyId: data.companyId,
      ownerId: data.ownerId ?? user.id,
      closedAt: closed ? new Date() : null,
    },
  });
  await logActivity({
    type: "CREATED",
    message: `Deal ${deal.name} created`,
    actorId: user.id,
    dealId: deal.id,
    contactId: deal.contactId,
    companyId: deal.companyId,
  });
  return ok(deal, 201);
}, "record:create");
