import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { segmentSchema } from "@/lib/validations";

export const GET = withAuth(async () => {
  const segments = await prisma.segment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, avatarColor: true } },
      _count: { select: { campaigns: true } },
    },
  });
  return ok({ segments });
});

export const POST = withAuth(async (user, req) => {
  const body = await req.json();
  const data = segmentSchema.parse(body);
  const segment = await prisma.segment.create({
    data: {
      name: data.name,
      description: data.description,
      filters: JSON.stringify(data.filters),
      ownerId: user.id,
    },
  });
  return ok(segment, 201);
}, "record:create");
