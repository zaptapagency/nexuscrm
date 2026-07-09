import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOwnerOptions } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LifecycleBadge, DealStageBadge } from "@/components/status-badges";
import { UserAvatar } from "@/components/user-avatar";
import { ActivityTimeline } from "@/components/activity-timeline";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CompanyHeaderActions } from "./company-header-actions";
import { ArrowLeft, Globe, Phone, MapPin, Building2, Users, Handshake } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  return { title: company?.name ?? "Company not found" };
}

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, avatarColor: true } },
      contacts: {
        orderBy: { lastName: "asc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          lifecycleStage: true,
        },
      },
      deals: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, amount: true, stage: true },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { actor: { select: { name: true } } },
      },
    },
  });

  if (!company) notFound();

  const owners = await getOwnerOptions();
  const openDealValue = company.deals
    .filter((d) => d.stage !== "CLOSED_WON" && d.stage !== "CLOSED_LOST")
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      <Link
        href="/companies"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to companies
      </Link>

      <PageHeader title={company.name} description={company.industry ?? undefined}>
        <CompanyHeaderActions
          company={{
            id: company.id,
            name: company.name,
            domain: company.domain,
            industry: company.industry,
            size: company.size,
            phone: company.phone,
            city: company.city,
            country: company.country,
            website: company.website,
            ownerId: company.ownerId,
          }}
          owners={owners.map((o) => ({ id: o.id, name: o.name }))}
        />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:text-primary"
                  >
                    {company.domain || company.website}
                  </a>
                ) : (
                  <span>{company.domain || "—"}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{company.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{company.size ? `${company.size} employees` : "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{[company.city, company.country].filter(Boolean).join(", ") || "—"}</span>
              </div>
              <div className="border-t pt-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Owner</p>
                {company.owner ? (
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      name={company.owner.name}
                      color={company.owner.avatarColor}
                      className="h-6 w-6"
                    />
                    <span>{company.owner.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Open pipeline</p>
                  <p className="font-semibold">{formatCurrency(openDealValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Added</p>
                  <p className="font-semibold">{formatDate(company.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" /> Contacts ({company.contacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.contacts.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No contacts at this company yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {company.contacts.map((c) => (
                    <li key={c.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <Link
                          href={`/contacts/${c.id}`}
                          className="text-sm font-medium hover:text-primary"
                        >
                          {c.firstName} {c.lastName}
                        </Link>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </div>
                      <LifecycleBadge stage={c.lifecycleStage} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Handshake className="h-4 w-4" /> Deals ({company.deals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.deals.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No deals for this company yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {company.deals.map((d) => (
                    <li key={d.id} className="flex items-center justify-between py-2.5">
                      <Link
                        href={`/deals?highlight=${d.id}`}
                        className="text-sm font-medium hover:text-primary"
                      >
                        {d.name}
                      </Link>
                      <div className="flex items-center gap-3">
                        <span className="text-sm tabular-nums">{formatCurrency(d.amount)}</span>
                        <DealStageBadge stage={d.stage} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {company.activities.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No activity yet"
                  description="Activity on this company and its records will appear here."
                />
              ) : (
                <ActivityTimeline
                  activities={company.activities.map((a) => ({
                    id: a.id,
                    type: a.type,
                    message: a.message,
                    createdAt: a.createdAt.toISOString(),
                    actor: a.actor,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
