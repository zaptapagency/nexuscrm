import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Public, unauthenticated: fetches a published form's definition for rendering.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const form = await prisma.form.findUnique({ where: { slug: params.slug } });

  if (!form || !form.published) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: form.id,
    name: form.name,
    description: form.description,
    fields: JSON.parse(form.fields),
    submitText: form.submitText,
    successMessage: form.successMessage,
  });
}
