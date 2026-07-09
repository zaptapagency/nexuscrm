import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { FormField } from "@/lib/validations";
import { ArrowLeft, Inbox } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const form = await prisma.form.findUnique({ where: { id: params.id }, select: { name: true } });
  if (!form) return { title: "Form not found" };
  return { title: form.name };
}

export default async function FormDetailPage({ params }: { params: { id: string } }) {
  const form = await prisma.form.findUnique({
    where: { id: params.id },
    include: {
      submissions: {
        orderBy: { createdAt: "desc" },
        include: { contact: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  });

  if (!form) notFound();

  const fields: FormField[] = JSON.parse(form.fields);
  const publicUrl = `/f/${form.slug}`;

  return (
    <div className="space-y-6">
      <Link
        href="/forms"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to forms
      </Link>

      <PageHeader title={form.name} description={form.description ?? undefined}>
        <Badge variant={form.published ? "default" : "secondary"}>
          {form.published ? "Published" : "Unpublished"}
        </Badge>
      </PageHeader>

      <Card>
        <CardContent className="flex items-center justify-between p-4 text-sm">
          <span className="text-muted-foreground">Public link</span>
          <Link href={publicUrl} target="_blank" className="font-mono text-primary hover:underline">
            {publicUrl}
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submissions ({form.submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {form.submissions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <Inbox className="h-8 w-8" />
              <p>No submissions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">Contact</th>
                    {fields.map((f) => (
                      <th key={f.id} className="pb-2 font-medium">
                        {f.label}
                      </th>
                    ))}
                    <th className="pb-2 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {form.submissions.map((s) => {
                    const data = JSON.parse(s.data) as Record<string, string>;
                    return (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2">
                          {s.contact ? (
                            <Link href={`/contacts/${s.contact.id}`} className="hover:text-primary">
                              {s.contact.firstName} {s.contact.lastName}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        {fields.map((f) => (
                          <td key={f.id} className="max-w-[200px] truncate py-2 text-muted-foreground">
                            {data[f.id] || "—"}
                          </td>
                        ))}
                        <td className="py-2 text-muted-foreground">
                          {formatDateTime(s.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
