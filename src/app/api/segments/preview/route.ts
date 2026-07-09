import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { segmentFilterSchema } from "@/lib/validations";
import { buildContactWhere } from "@/lib/segments";

export const POST = withAuth(async (_user, req) => {
  const body = await req.json();
  const filters = segmentFilterSchema.parse(body.filters ?? body);
  const where = buildContactWhere(filters);
  const count = await prisma.contact.count({ where });
  return ok({ count });
});
