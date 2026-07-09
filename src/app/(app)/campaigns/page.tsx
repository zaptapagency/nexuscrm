import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSegmentOptions } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { CampaignsClient, type CampaignRow } from "./campaigns-client";

export const metadata: Metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  const [campaigns, segments] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        segment: { select: { id: true, name: true } },
        recipients: { select: { opened: true, clicked: true } },
      },
    }),
    getSegmentOptions(),
  ]);

  const rows: CampaignRow[] = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    body: c.body,
    fromName: c.fromName,
    status: c.status,
    segmentId: c.segmentId,
    segmentName: c.segment?.name ?? null,
    sentAt: c.sentAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    recipientCount: c.recipients.length,
    openedCount: c.recipients.filter((r) => r.opened).length,
    clickedCount: c.recipients.filter((r) => r.clicked).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Design email campaigns, send them to a segment, and track opens and clicks."
      />
      <CampaignsClient campaigns={rows} segments={segments} />
    </div>
  );
}
