import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";

const schema = z.object({ ids: z.array(z.string()).min(1) });

export const POST = withAuth(async (_user, req) => {
  const body = await req.json();
  const { ids } = schema.parse(body);
  const result = await prisma.contact.deleteMany({ where: { id: { in: ids } } });
  return ok({ deleted: result.count });
}, "record:delete");
