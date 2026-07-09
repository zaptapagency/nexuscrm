import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { FormField } from "@/lib/validations";
import { PublicForm } from "./public-form";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const form = await prisma.form.findUnique({
    where: { slug: params.slug },
    select: { name: true, published: true },
  });
  if (!form || !form.published) return { title: "Form not found" };
  return { title: form.name };
}

export default async function PublicFormPage({ params }: { params: { slug: string } }) {
  const form = await prisma.form.findUnique({ where: { slug: params.slug } });

  if (!form || !form.published) notFound();

  const fields: FormField[] = JSON.parse(form.fields);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-lg">
        <PublicForm
          slug={form.slug}
          name={form.name}
          description={form.description}
          submitText={form.submitText}
          fields={fields}
        />
      </div>
    </div>
  );
}
