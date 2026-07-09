"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/client-api";
import { canDelete } from "@/lib/rbac";
import { CompanyDialog, type CompanyFormData } from "../company-dialog";
import { Pencil, Trash2 } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

export function CompanyHeaderActions({
  company,
  owners,
}: {
  company: CompanyFormData & { id: string };
  owners: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const allowDelete = canDelete(session?.user.role);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function remove() {
    if (!confirm("Delete this company? Contacts and deals will be unlinked.")) return;
    try {
      await apiFetch(`/api/companies/${company.id}`, { method: "DELETE" });
      toast({ title: "Company deleted" });
      router.push("/companies");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
        <Pencil className="h-4 w-4" /> Edit
      </Button>
      {allowDelete && (
        <Button variant="destructive" size="sm" onClick={remove}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      )}
      <CompanyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={company}
        owners={owners}
      />
    </>
  );
}
