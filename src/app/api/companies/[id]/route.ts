import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { companySchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export const GET = withAuth(async (_user, _req, { params }) => {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: params.id },
    include: { owner: true },
  });
  return ok(company);
});

export const PATCH = withAuth(async (user, req, { params }) => {
  const body = await req.json();
  const data = companySchema.partial().parse(body);
  const company = await prisma.company.update({
    where: { id: params.id },
    data: { ...data, ...(data.size !== undefined ? { size: data.size || null } : {}) },
  });
  await logActivity({
    type: "UPDATED",
    message: `Company details updated`,
    actorId: user.id,
    companyId: company.id,
  });
  return ok(company);
}, "record:edit");

export const DELETE = withAuth(async (_user, _req, { params }) => {
  await prisma.company.delete({ where: { id: params.id } });
  return ok({ success: true });
}, "record:delete");
