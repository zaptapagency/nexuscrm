"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/client-api";
import { canDelete } from "@/lib/rbac";
import { ContactDialog, type ContactFormData } from "../contact-dialog";
import { Pencil, Trash2 } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

export function ContactHeaderActions({
  contact,
  companies,
  owners,
}: {
  contact: ContactFormData & { id: string };
  companies: Option[];
  owners: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const allowDelete = canDelete(session?.user.role);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function remove() {
    if (!confirm("Delete this contact? This cannot be undone.")) return;
    try {
      await apiFetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
      toast({ title: "Contact deleted" });
      router.push("/contacts");
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
      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={contact}
        companies={companies}
        owners={owners}
      />
    </>
  );
}
