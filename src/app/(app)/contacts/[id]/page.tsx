import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCompanyOptions, getOwnerOptions } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LifecycleBadge } from "@/components/status-badges";
import { UserAvatar } from "@/components/user-avatar";
import { ActivityTimeline } from "@/components/activity-timeline";
import { formatDate } from "@/lib/utils";
import { ContactHeaderActions } from "./contact-header-actions";
import { ContactNotes } from "./contact-notes";
import { ArrowLeft, Mail, Phone, Briefcase, Building2 } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const contact = await prisma.contact.findUnique({
    where: { id: params.id },
    select: { firstName: true, lastName: true },
  });
  if (!contact) return { title: "Contact not found" };
  return { title: `${contact.firstName} ${contact.lastName}` };
}

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const contact = await prisma.contact.findUnique({
    where: { id: params.id },
    include: {
      company: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, avatarColor: true } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true, avatarColor: true } } },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { actor: { select: { name: true } } },
      },
    },
  });

  if (!contact) notFound();

  const [companies, owners] = await Promise.all([getCompanyOptions(), getOwnerOptions()]);

  return (
    <div className="space-y-6">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to contacts
      </Link>

      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        description={contact.jobTitle ?? undefined}
      >
        <ContactHeaderActions
          contact={{
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            jobTitle: contact.jobTitle,
            lifecycleStage: contact.lifecycleStage,
            companyId: contact.companyId,
            ownerId: contact.ownerId,
          }}
          companies={companies}
          owners={owners.map((o) => ({ id: o.id, name: o.name }))}
        />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Details</CardTitle>
              <LifecycleBadge stage={contact.lifecycleStage} />
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${contact.email}`} className="hover:text-primary">
                  {contact.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{contact.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{contact.jobTitle || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {contact.company ? (
                  <Link href={`/companies/${contact.company.id}`} className="hover:text-primary">
                    {contact.company.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">No company</span>
                )}
              </div>
              <div className="border-t pt-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Owner</p>
                {contact.owner ? (
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      name={contact.owner.name}
                      color={contact.owner.avatarColor}
                      className="h-6 w-6"
                    />
                    <span>{contact.owner.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </div>
              <div className="flex justify-between border-t pt-3 text-xs text-muted-foreground">
                <span>Source: {contact.source || "—"}</span>
                <span>Added {formatDate(contact.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactNotes
                contactId={contact.id}
                initialNotes={contact.notes.map((n) => ({
                  id: n.id,
                  body: n.body,
                  createdAt: n.createdAt.toISOString(),
                  author: n.author,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline
                activities={contact.activities.map((a) => ({
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
    </div>
  );
}
