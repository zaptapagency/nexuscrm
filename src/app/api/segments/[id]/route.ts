import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { segmentSchema } from "@/lib/validations";

export const PATCH = withAuth(async (_user, req, { params }) => {
  const body = await req.json();
  const data = segmentSchema.partial().parse(body);
  const segment = await prisma.segment.update({
    where: { id: params.id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.filters !== undefined ? { filters: JSON.stringify(data.filters) } : {}),
    },
  });
  return ok(segment);
}, "record:edit");

export const DELETE = withAuth(async (_user, _req, { params }) => {
  await prisma.segment.delete({ where: { id: params.id } });
  return ok({ success: true });
}, "record:delete");
