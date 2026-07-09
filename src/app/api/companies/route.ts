import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { companySchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { PAGE_SIZE } from "@/lib/constants";

const SORTABLE = new Set(["name", "industry", "city", "createdAt"]);

export const GET = withAuth(async (_user, req) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const q = (searchParams.get("q") ?? "").trim();
  const sortParam = searchParams.get("sort") ?? "createdAt";
  const sort = SORTABLE.has(sortParam) ? sortParam : "createdAt";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const industry = searchParams.get("industry") ?? "";
  const ownerId = searchParams.get("ownerId") ?? "";

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

  const [total, companies] = await Promise.all([
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
  ]);

  return ok({ companies, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
});

export const POST = withAuth(async (user, req) => {
  const body = await req.json();
  const data = companySchema.parse(body);
  const company = await prisma.company.create({
    data: {
      ...data,
      size: data.size || null,
      ownerId: data.ownerId ?? user.id,
    },
  });
  await logActivity({
    type: "CREATED",
    message: `Company ${company.name} created`,
    actorId: user.id,
    companyId: company.id,
  });
  return ok(company, 201);
}, "record:create");
