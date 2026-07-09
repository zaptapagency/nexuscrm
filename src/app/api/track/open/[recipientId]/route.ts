import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 1x1 transparent GIF.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(
  _req: Request,
  { params }: { params: { recipientId: string } },
) {
  try {
    await prisma.campaignRecipient.update({
      where: { id: params.recipientId },
      data: { opened: true, openedAt: new Date() },
    });
  } catch {
    // Ignore unknown/deleted recipients — always return the pixel.
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Content-Length": String(PIXEL.length),
    },
  });
}
