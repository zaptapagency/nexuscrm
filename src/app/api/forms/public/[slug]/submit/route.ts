import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { handleError } from "@/lib/api";
import { NextResponse } from "next/server";
import type { FormField } from "@/lib/validations";

const submitSchema = z.object({
  values: z.record(z.string(), z.string()),
});

// Public, unauthenticated: accepts a visitor's form submission.
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const form = await prisma.form.findUnique({ where: { slug: params.slug } });
    if (!form || !form.published) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const { values } = submitSchema.parse(await req.json());
    const fields: FormField[] = JSON.parse(form.fields);

    const issues: Record<string, string[]> = {};
    for (const field of fields) {
      const raw = (values[field.id] ?? "").trim();
      if (field.required && !raw) {
        issues[field.id] = ["This field is required."];
        continue;
      }
      if (field.type === "email" && raw && !z.string().email().safeParse(raw).success) {
        issues[field.id] = ["Enter a valid email address."];
      }
    }
    if (Object.keys(issues).length > 0) {
      return NextResponse.json({ error: "Validation failed", issues }, { status: 422 });
    }

    const mapped: Record<string, string> = {};
    for (const field of fields) {
      if (field.mapsTo !== "none") {
        const raw = (values[field.id] ?? "").trim();
        if (raw) mapped[field.mapsTo] = raw;
      }
    }

    let contactId: string | undefined;
    if (mapped.email) {
      const contact = await prisma.contact.upsert({
        where: { email: mapped.email.toLowerCase() },
        update: {
          firstName: mapped.firstName || undefined,
          lastName: mapped.lastName || undefined,
          phone: mapped.phone || undefined,
          jobTitle: mapped.jobTitle || undefined,
        },
        create: {
          email: mapped.email.toLowerCase(),
          firstName: mapped.firstName || "Unknown",
          lastName: mapped.lastName || "Unknown",
          phone: mapped.phone || undefined,
          jobTitle: mapped.jobTitle || undefined,
          source: `Form: ${form.name}`,
        },
      });
      contactId = contact.id;
    }

    await prisma.formSubmission.create({
      data: {
        formId: form.id,
        contactId,
        data: JSON.stringify(values),
      },
    });

    await logActivity({
      type: "FORM_SUBMITTED",
      message: `Submitted the "${form.name}" form`,
      contactId,
    });

    return NextResponse.json({ successMessage: form.successMessage });
  } catch (err) {
    return handleError(err);
  }
}
