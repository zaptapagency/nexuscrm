import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export const GET = withAuth(async (_user, req) => {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return ok({ contacts: [], companies: [], deals: [] });
  }

  const [contacts, companies, deals] = await Promise.all([
    prisma.contact.findMany({
      where: {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { company: { select: { name: true } } },
    }),
    prisma.company.findMany({
      where: { OR: [{ name: { contains: q } }, { domain: { contains: q } }] },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.deal.findMany({
      where: { name: { contains: q } },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return ok({
    contacts: contacts.map((c) => ({
      id: c.id,
      label: `${c.firstName} ${c.lastName}`,
      sub: c.company?.name ?? c.email,
    })),
    companies: companies.map((c) => ({
      id: c.id,
      label: c.name,
      sub: c.industry ?? c.domain ?? "",
    })),
    deals: deals.map((d) => ({
      id: d.id,
      label: d.name,
      sub: formatCurrency(d.amount),
    })),
  });
});
