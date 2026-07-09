import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { formSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export const GET = withAuth(async () => {
  const forms = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });
  return ok({ forms });
});

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "form";
  let candidate = root;
  let n = 1;
  while (await prisma.form.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

export const POST = withAuth(async (user, req) => {
  const body = await req.json();
  const data = formSchema.parse(body);
  const slug = await uniqueSlug(data.name);
  const form = await prisma.form.create({
    data: {
      name: data.name,
      description: data.description,
      slug,
      fields: JSON.stringify(data.fields),
      submitText: data.submitText,
      successMessage: data.successMessage,
      published: data.published,
      ownerId: user.id,
    },
  });
  return ok(form, 201);
}, "form:manage");
