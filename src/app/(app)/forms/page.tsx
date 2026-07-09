import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { FormsClient, type FormRow } from "./forms-client";

export const metadata: Metadata = { title: "Forms" };

export default async function FormsPage() {
  const forms = await prisma.form.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  const rows: FormRow[] = forms.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    slug: f.slug,
    submitText: f.submitText,
    successMessage: f.successMessage,
    published: f.published,
    fields: JSON.parse(f.fields),
    submissionCount: f._count.submissions,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forms"
        description="Build lead-capture forms and embed them anywhere. Submissions create contacts automatically."
      />
      <FormsClient forms={rows} />
    </div>
  );
}
