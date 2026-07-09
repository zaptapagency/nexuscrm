import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { campaignSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export const GET = withAuth(async (_user, _req, { params }) => {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: params.id },
    include: { segment: true, owner: true },
  });
  return ok(campaign);
});

export const PATCH = withAuth(async (_user, req, { params }) => {
  const existing = await prisma.campaign.findUniqueOrThrow({ where: { id: params.id } });
  if (existing.status === "SENT") {
    return NextResponse.json({ error: "Sent campaigns cannot be edited." }, { status: 400 });
  }
  const body = await req.json();
  const data = campaignSchema.partial().parse(body);
  const campaign = await prisma.campaign.update({ where: { id: params.id }, data });
  return ok(campaign);
}, "record:edit");

export const DELETE = withAuth(async (_user, _req, { params }) => {
  await prisma.campaign.delete({ where: { id: params.id } });
  return ok({ success: true });
}, "record:delete");
