import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { formSchema } from "@/lib/validations";

export const GET = withAuth(async (_user, _req, { params }) => {
  const form = await prisma.form.findUniqueOrThrow({
    where: { id: params.id },
    include: {
      submissions: {
        orderBy: { createdAt: "desc" },
        include: { contact: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  });
  return ok(form);
});

export const PATCH = withAuth(async (_user, req, { params }) => {
  const body = await req.json();
  const data = formSchema.partial().parse(body);
  const form = await prisma.form.update({
    where: { id: params.id },
    data: {
      ...data,
      fields: data.fields ? JSON.stringify(data.fields) : undefined,
    },
  });
  return ok(form);
}, "form:manage");

export const DELETE = withAuth(async (_user, _req, { params }) => {
  await prisma.form.delete({ where: { id: params.id } });
  return ok({ success: true });
}, "form:manage");
