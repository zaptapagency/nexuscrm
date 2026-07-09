import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { recipientId: string } },
) {
  const target = new URL(req.url).searchParams.get("url");

  try {
    await prisma.campaignRecipient.update({
      where: { id: params.recipientId },
      data: { clicked: true, clickedAt: new Date(), opened: true, openedAt: new Date() },
    });
  } catch {
    // Ignore unknown/deleted recipients.
  }

  // Only redirect to absolute http(s) URLs to avoid open-redirect abuse.
  if (target && /^https?:\/\//i.test(target)) {
    return NextResponse.redirect(target);
  }
  return NextResponse.json({ ok: true });
}
