import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { profileUpdateSchema } from "@/lib/validations";

export const PATCH = withAuth(async (user, req) => {
  const body = await req.json();
  const data = profileUpdateSchema.parse(body);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, name: true, avatarColor: true, theme: true },
  });
  return ok(updated);
});
