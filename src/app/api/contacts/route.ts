import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { contactSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { PAGE_SIZE } from "@/lib/constants";

const SORTABLE = new Set(["firstName", "lastName", "email", "lifecycleStage", "createdAt"]);

export const GET = withAuth(async (_user, req) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const q = (searchParams.get("q") ?? "").trim();
  const sortParam = searchParams.get("sort") ?? "createdAt";
  const sort = SORTABLE.has(sortParam) ? sortParam : "createdAt";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const lifecycleStage = searchParams.get("lifecycleStage") ?? "";
  const ownerId = searchParams.get("ownerId") ?? "";
  const companyId = searchParams.get("companyId") ?? "";

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
  if (companyId) where.companyId = companyId;

  const [total, contacts] = await Promise.all([
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
  ]);

  return ok({ contacts, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
});

export const POST = withAuth(async (user, req) => {
  const body = await req.json();
  const data = contactSchema.parse(body);
  const contact = await prisma.contact.create({
    data: { ...data, ownerId: data.ownerId ?? user.id },
  });
  await logActivity({
    type: "CREATED",
    message: `Contact ${contact.firstName} ${contact.lastName} created`,
    actorId: user.id,
    contactId: contact.id,
  });
  return ok(contact, 201);
}, "record:create");
