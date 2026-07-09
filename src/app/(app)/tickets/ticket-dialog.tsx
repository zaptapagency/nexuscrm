"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/client-api";
import { TICKET_STATUSES, TICKET_STATUS_LABELS, TICKET_PRIORITIES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

export interface TicketFormData {
  id?: string;
  subject: string;
  description?: string | null;
  status: string;
  priority: string;
  contactId?: string | null;
  assigneeId?: string | null;
}

interface Option {
  id: string;
  name: string;
}

const NONE = "__none__";

export function TicketDialog({
  open,
  onOpenChange,
  ticket,
  defaultStatus,
  contacts,
  assignees,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ticket?: TicketFormData;
  defaultStatus?: string;
  contacts: Option[];
  assignees: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(ticket?.id);
  const [form, setForm] = useState<TicketFormData>(
    ticket ?? {
      subject: "",
      description: "",
      status: defaultStatus ?? "NEW",
      priority: "MEDIUM",
      contactId: "",
      assigneeId: "",
    },
  );

  function set<K extends keyof TicketFormData>(key: K, value: TicketFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        subject: form.subject,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        contactId: form.contactId || undefined,
        assigneeId: form.assigneeId || undefined,
      };
      if (isEdit) {
        await apiFetch(`/api/tickets/${ticket!.id}`, { method: "PATCH", json: payload });
        toast({ title: "Ticket updated" });
      } else {
        await apiFetch("/api/tickets", { method: "POST", json: payload });
        toast({ title: "Ticket created" });
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save ticket",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit ticket" : "New ticket"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tk-subject">Subject</Label>
            <Input
              id="tk-subject"
              required
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tk-desc">Description</Label>
            <Textarea
              id="tk-desc"
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TICKET_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact</Label>
              <Select
                value={form.contactId || NONE}
                onValueChange={(v) => set("contactId", v === NONE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={form.assigneeId || NONE}
                onValueChange={(v) => set("assigneeId", v === NONE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {assignees.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
