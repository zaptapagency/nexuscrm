import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { OutboxClient, type OutboxRow } from "./outbox-client";

export const metadata: Metadata = { title: "Outbox" };

export default async function OutboxPage() {
  const emails = await prisma.outboxEmail.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows: OutboxRow[] = emails.map((e) => ({
    id: e.id,
    toEmail: e.toEmail,
    toName: e.toName,
    fromName: e.fromName,
    subject: e.subject,
    body: e.body,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outbox"
        description="Every email sent by a campaign is captured here. Open one to preview the rendered message."
      />
      <OutboxClient emails={rows} />
    </div>
  );
}
