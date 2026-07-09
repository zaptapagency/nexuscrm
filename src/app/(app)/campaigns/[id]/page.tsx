import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, relativeTime } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  MailOpen,
  MousePointerClick,
  Send,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  if (!campaign) return { title: "Campaign not found" };
  return { title: campaign.name };
}

function pct(part: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export default async function CampaignReportPage({ params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      segment: { select: { id: true, name: true } },
      owner: { select: { name: true } },
      recipients: {
        orderBy: { createdAt: "asc" },
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!campaign) notFound();

  const total = campaign.recipients.length;
  const opened = campaign.recipients.filter((r) => r.opened).length;
  const clicked = campaign.recipients.filter((r) => r.clicked).length;
  const isSent = campaign.status === "SENT";

  const stats = [
    { label: "Recipients", value: String(total), icon: Users },
    { label: "Opened", value: `${opened} (${pct(opened, total)})`, icon: MailOpen },
    { label: "Clicked", value: `${clicked} (${pct(clicked, total)})`, icon: MousePointerClick },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to campaigns
      </Link>

      <PageHeader title={campaign.name} description={campaign.subject}>
        <Badge variant={isSent ? "default" : "secondary"}>{isSent ? "Sent" : "Draft"}</Badge>
      </PageHeader>

      <Card>
        <CardContent className="grid gap-4 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">From</p>
            <p className="mt-1">{campaign.fromName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Segment</p>
            <p className="mt-1">{campaign.segment?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Owner</p>
            <p className="mt-1">{campaign.owner?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Sent</p>
            <p className="mt-1">
              {campaign.sentAt ? formatDateTime(campaign.sentAt) : "Not sent yet"}
            </p>
          </div>
        </CardContent>
      </Card>

      {isSent && (
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-md bg-muted p-2">
                  <s.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recipients</CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <Send className="h-8 w-8" />
              <p>This campaign hasn&apos;t been sent yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">Contact</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Opened</th>
                    <th className="pb-2 font-medium">Clicked</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.recipients.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2">
                        {r.contact ? (
                          <Link
                            href={`/contacts/${r.contact.id}`}
                            className="hover:text-primary"
                          >
                            {r.contact.firstName} {r.contact.lastName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 text-muted-foreground">{r.email}</td>
                      <td className="py-2">
                        {r.opened ? (
                          <span title={r.openedAt ? formatDateTime(r.openedAt) : undefined}>
                            <Badge variant="secondary">
                              {r.openedAt ? relativeTime(r.openedAt) : "Yes"}
                            </Badge>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2">
                        {r.clicked ? (
                          <span title={r.clickedAt ? formatDateTime(r.clickedAt) : undefined}>
                            <Badge>{r.clickedAt ? relativeTime(r.clickedAt) : "Yes"}</Badge>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
