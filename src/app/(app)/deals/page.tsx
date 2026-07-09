import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getContactOptions, getCompanyOptions, getOwnerOptions } from "@/lib/queries";
import { openPipelineValue, wonValue } from "@/lib/stats";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { DealsBoard } from "./deals-board";

export const metadata: Metadata = { title: "Deals" };

export default async function DealsPage() {
  const [deals, contacts, companies, owners] = await Promise.all([
    prisma.deal.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, avatarColor: true } },
      },
    }),
    getContactOptions(),
    getCompanyOptions(),
    getOwnerOptions(),
  ]);

  const open = openPipelineValue(deals);
  const won = wonValue(deals);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        description={`${formatCurrency(open)} open pipeline · ${formatCurrency(won)} won`}
      />
      <DealsBoard
        initialDeals={deals.map((d) => ({
          id: d.id,
          name: d.name,
          amount: d.amount,
          stage: d.stage,
          closeDate: d.closeDate ? d.closeDate.toISOString() : null,
          contactId: d.contactId,
          companyId: d.companyId,
          ownerId: d.ownerId,
          contact: d.contact,
          company: d.company,
          owner: d.owner,
        }))}
        contacts={contacts.map((c) => ({ id: c.id, name: c.name }))}
        companies={companies}
        owners={owners.map((o) => ({ id: o.id, name: o.name }))}
      />
    </div>
  );
}
