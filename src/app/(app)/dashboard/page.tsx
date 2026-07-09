import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { ActivityTimeline } from "@/components/activity-timeline";
import { formatCurrency } from "@/lib/utils";
import {
  pipelineByStage,
  winRate,
  openPipelineValue,
  wonValue,
  wonLostOverTime,
  contactsPerWeek,
  ticketsByStatus,
  repLeaderboard,
} from "@/lib/stats";
import { TICKET_STATUS_LABELS, type TicketStatus } from "@/lib/constants";
import {
  DashboardCharts,
} from "./dashboard-charts";
import { DollarSign, Users, Trophy } from "lucide-react";

export default async function DashboardPage() {
  const [deals, contacts, tickets, activities] = await Promise.all([
    prisma.deal.findMany({
      select: {
        stage: true,
        amount: true,
        closedAt: true,
        createdAt: true,
        ownerId: true,
        owner: { select: { name: true } },
      },
    }),
    prisma.contact.findMany({ select: { createdAt: true } }),
    prisma.ticket.findMany({ select: { status: true } }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { actor: { select: { name: true } } },
    }),
  ]);

  const dealsForStats = deals.map((d) => ({
    stage: d.stage,
    amount: d.amount,
    closedAt: d.closedAt,
    createdAt: d.createdAt,
  }));

  const pipeline = pipelineByStage(dealsForStats);
  const rate = winRate(dealsForStats);
  const openValue = openPipelineValue(dealsForStats);
  const won = wonValue(dealsForStats);
  const wonLost = wonLostOverTime(dealsForStats);
  const weeklyContacts = contactsPerWeek(contacts);
  const byStatus = ticketsByStatus(tickets);
  const leaderboard = repLeaderboard(
    deals.map((d) => ({
      stage: d.stage,
      amount: d.amount,
      closedAt: d.closedAt,
      createdAt: d.createdAt,
      ownerId: d.ownerId,
      ownerName: d.owner?.name,
    })),
  ).slice(0, 5);

  const stats = [
    {
      label: "Open pipeline",
      value: formatCurrency(openValue),
      icon: DollarSign,
    },
    {
      label: "Closed-won value",
      value: formatCurrency(won),
      icon: DollarSign,
    },
    {
      label: "Win rate",
      value: `${Math.round(rate * 100)}%`,
      icon: Trophy,
    },
    {
      label: "Total contacts",
      value: String(contacts.length),
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Your workspace at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <DashboardCharts
        pipeline={pipeline}
        wonLost={wonLost}
        weeklyContacts={weeklyContacts}
        ticketsByStatus={byStatus.map((t) => ({
          status: t.status,
          label: TICKET_STATUS_LABELS[t.status as TicketStatus] ?? t.status,
          count: t.count,
        }))}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rep leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">No closed-won deals yet.</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((r, i) => (
                  <div key={r.ownerId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-4 text-sm font-medium text-muted-foreground">
                        {i + 1}
                      </span>
                      <UserAvatar name={r.name} color="#6366f1" className="h-7 w-7" />
                      <span className="text-sm">{r.name}</span>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{formatCurrency(r.wonValue)}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.wonCount} deal{r.wonCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline
              activities={activities.map((a) => ({
                id: a.id,
                type: a.type,
                message: a.message,
                createdAt: a.createdAt.toISOString(),
                actor: a.actor,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
