"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/client-api";
import { canDelete } from "@/lib/rbac";
import { FormDialog, type FormFormData } from "./form-dialog";
import {
  FileText,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link as LinkIcon,
  Users,
  Check,
} from "lucide-react";

export interface FormRow {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  submitText: string;
  successMessage: string;
  published: boolean;
  fields: FormFormData["fields"];
  submissionCount: number;
}

export function FormsClient({ forms }: { forms: FormRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const allowDelete = canDelete(session?.user.role);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FormFormData | undefined>();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyLink(slug: string, id: string) {
    const url = `${window.location.origin}/f/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      toast({ variant: "destructive", title: "Could not copy link" });
    }
  }

  async function deleteOne(id: string) {
    if (!confirm("Delete this form? All submission history will be removed.")) return;
    try {
      await apiFetch(`/api/forms/${id}`, { method: "DELETE" });
      toast({ title: "Form deleted" });
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New form
        </Button>
      </div>

      {forms.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No forms yet"
          description="Build a form to capture leads from your website into NexusCRM."
          action={
            <Button
              onClick={() => {
                setEditing(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New form
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((f) => (
            <Card key={f.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <Link href={`/forms/${f.id}`} className="truncate font-medium hover:underline">
                      {f.name}
                    </Link>
                    {f.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {f.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Form actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing({
                            id: f.id,
                            name: f.name,
                            description: f.description,
                            submitText: f.submitText,
                            successMessage: f.successMessage,
                            published: f.published,
                            fields: f.fields,
                          });
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/forms/${f.id}`}>
                          <Users className="h-4 w-4" /> View submissions
                        </Link>
                      </DropdownMenuItem>
                      {allowDelete && (
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteOne(f.id)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={f.published ? "default" : "secondary"}>
                    {f.published ? "Published" : "Unpublished"}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" /> {f.submissionCount} submissions
                  </Badge>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-auto"
                  onClick={() => copyLink(f.slug, f.id)}
                >
                  {copiedId === f.id ? (
                    <>
                      <Check className="h-4 w-4" /> Copied
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" /> Copy public link
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormDialog open={dialogOpen} onOpenChange={setDialogOpen} form={editing} />
    </div>
  );
}
