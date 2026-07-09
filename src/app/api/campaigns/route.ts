import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { campaignSchema } from "@/lib/validations";

export const GET = withAuth(async () => {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      segment: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, avatarColor: true } },
      _count: { select: { recipients: true } },
    },
  });
  return ok({ campaigns });
});

export const POST = withAuth(async (user, req) => {
  const body = await req.json();
  const data = campaignSchema.parse(body);
  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      subject: data.subject,
      body: data.body,
      fromName: data.fromName,
      segmentId: data.segmentId,
      ownerId: user.id,
      status: "DRAFT",
    },
  });
  return ok(campaign, 201);
}, "record:create");
