import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOwnerOptions } from "@/lib/queries";
import { PAGE_SIZE } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { CompaniesClient } from "./companies-client";

export const metadata: Metadata = { title: "Companies" };

const SORTABLE = new Set(["name", "industry", "city", "createdAt"]);

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const q = (searchParams.q ?? "").trim();
  const sort = SORTABLE.has(searchParams.sort ?? "") ? searchParams.sort! : "createdAt";
  const dir = searchParams.dir === "asc" ? "asc" : "desc";
  const industry = searchParams.industry ?? "";
  const ownerId = searchParams.ownerId ?? "";

  const where: Prisma.CompanyWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { domain: { contains: q } },
      { city: { contains: q } },
    ];
  }
  if (industry) where.industry = industry;
  if (ownerId) where.ownerId = ownerId;

  const [total, companies, owners] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        owner: { select: { id: true, name: true, avatarColor: true } },
        _count: { select: { contacts: true, deals: true } },
      },
    }),
    getOwnerOptions(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description={`${total} ${total === 1 ? "company" : "companies"} in your workspace.`}
      />
      <CompaniesClient
        companies={companies.map((c) => ({
          id: c.id,
          name: c.name,
          domain: c.domain,
          industry: c.industry,
          size: c.size,
          phone: c.phone,
          city: c.city,
          country: c.country,
          website: c.website,
          ownerId: c.ownerId,
          owner: c.owner,
          _count: c._count,
        }))}
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
