"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { DEAL_STAGES, DEAL_STAGE_LABELS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

export interface DealFormData {
  id?: string;
  name: string;
  amount: number;
  stage: string;
  closeDate?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  ownerId?: string | null;
}

interface Option {
  id: string;
  name: string;
}

const NONE = "__none__";

export function DealDialog({
  open,
  onOpenChange,
  deal,
  defaultStage,
  contacts,
  companies,
  owners,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  deal?: DealFormData;
  defaultStage?: string;
  contacts: Option[];
  companies: Option[];
  owners: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(deal?.id);
  const [form, setForm] = useState<DealFormData>(
    deal ?? {
      name: "",
      amount: 0,
      stage: defaultStage ?? "PROSPECTING",
      closeDate: "",
      contactId: "",
      companyId: "",
      ownerId: "",
    },
  );

  function set<K extends keyof DealFormData>(key: K, value: DealFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        amount: form.amount,
        stage: form.stage,
        closeDate: form.closeDate || undefined,
        contactId: form.contactId || undefined,
        companyId: form.companyId || undefined,
        ownerId: form.ownerId || undefined,
      };
      if (isEdit) {
        await apiFetch(`/api/deals/${deal!.id}`, { method: "PATCH", json: payload });
        toast({ title: "Deal updated" });
      } else {
        await apiFetch("/api/deals", { method: "POST", json: payload });
        toast({ title: "Deal created" });
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save deal",
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
          <DialogTitle>{isEdit ? "Edit deal" : "New deal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="d-name">Deal name</Label>
            <Input
              id="d-name"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="d-amount">Amount (USD)</Label>
              <Input
                id="d-amount"
                type="number"
                min={0}
                step={100}
                value={form.amount}
                onChange={(e) => set("amount", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={(v) => set("stage", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {DEAL_STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="d-close">Close date</Label>
              <Input
                id="d-close"
                type="date"
                value={form.closeDate ? form.closeDate.slice(0, 10) : ""}
                onChange={(e) => set("closeDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select
                value={form.ownerId || NONE}
                onValueChange={(v) => set("ownerId", v === NONE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {owners.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
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
              <Label>Company</Label>
              <Select
                value={form.companyId || NONE}
                onValueChange={(v) => set("companyId", v === NONE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
              {isEdit ? "Save changes" : "Create deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
