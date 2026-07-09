import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCompanyOptions, getOwnerOptions } from "@/lib/queries";
import { PAGE_SIZE } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { ContactsClient } from "./contacts-client";

export const metadata: Metadata = { title: "Contacts" };

const SORTABLE = new Set(["firstName", "lastName", "email", "lifecycleStage", "createdAt"]);

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const q = (searchParams.q ?? "").trim();
  const sort = SORTABLE.has(searchParams.sort ?? "") ? searchParams.sort! : "createdAt";
  const dir = searchParams.dir === "asc" ? "asc" : "desc";
  const lifecycleStage = searchParams.lifecycleStage ?? "";
  const ownerId = searchParams.ownerId ?? "";

  const where: Prisma.ContactWhereInput = {};
  if (q) {
    where.OR = [
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { email: { contains: q } },
      { jobTitle: { contains: q } },
    ];
  }
  if (lifecycleStage) where.lifecycleStage = lifecycleStage;
  if (ownerId) where.ownerId = ownerId;

  const [total, contacts, companies, owners] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, avatarColor: true } },
      },
    }),
    getCompanyOptions(),
    getOwnerOptions(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description={`${total} ${total === 1 ? "contact" : "contacts"} in your workspace.`}
      />
      <ContactsClient
        contacts={contacts.map((c) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          jobTitle: c.jobTitle,
          lifecycleStage: c.lifecycleStage,
          companyId: c.companyId,
          ownerId: c.ownerId,
          company: c.company,
          owner: c.owner,
          createdAt: c.createdAt.toISOString(),
        }))}
        companies={companies}
        owners={owners.map((o) => ({ id: o.id, name: o.name }))}
        total={total}
        page={page}
        totalPages={totalPages}
        currentSort={sort}
        currentDir={dir}
      />
    </div>
  );
}
