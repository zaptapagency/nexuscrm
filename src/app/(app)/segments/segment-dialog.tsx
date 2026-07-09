"use client";

import { useState, useEffect } from "react";
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
import { LIFECYCLE_STAGES, LIFECYCLE_LABELS } from "@/lib/constants";
import { Loader2, Users } from "lucide-react";

export interface SegmentFilters {
  lifecycleStage?: string;
  ownerId?: string;
  companyId?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface SegmentFormData {
  id?: string;
  name: string;
  description?: string | null;
  filters: SegmentFilters;
}

interface Option {
  id: string;
  name: string;
}

const ANY = "__any__";

export function SegmentDialog({
  open,
  onOpenChange,
  segment,
  owners,
  companies,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  segment?: SegmentFormData;
  owners: Option[];
  companies: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(segment?.id);

  const [name, setName] = useState(segment?.name ?? "");
  const [description, setDescription] = useState(segment?.description ?? "");
  const [filters, setFilters] = useState<SegmentFilters>(segment?.filters ?? {});
  const [preview, setPreview] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);

  function setFilter<K extends keyof SegmentFilters>(key: K, value: string) {
    setFilters((f) => {
      const next = { ...f };
      if (!value) delete next[key];
      else next[key] = value;
      return next;
    });
  }

  // Live preview of matching contact count.
  useEffect(() => {
    if (!open) return;
    let active = true;
    setPreviewing(true);
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch<{ count: number }>("/api/segments/preview", {
          method: "POST",
          json: { filters },
        });
        if (active) setPreview(res.count);
      } catch {
        if (active) setPreview(null);
      } finally {
        if (active) setPreviewing(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [filters, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, description: description || undefined, filters };
      if (isEdit) {
        await apiFetch(`/api/segments/${segment!.id}`, { method: "PATCH", json: payload });
        toast({ title: "Segment updated" });
      } else {
        await apiFetch("/api/segments", { method: "POST", json: payload });
        toast({ title: "Segment created" });
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save segment",
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
          <DialogTitle>{isEdit ? "Edit segment" : "New segment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sg-name">Name</Label>
            <Input id="sg-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sg-desc">Description</Label>
            <Textarea
              id="sg-desc"
              rows={2}
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="rounded-lg border p-4">
            <p className="mb-3 text-sm font-medium">Contact filters</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lifecycle stage</Label>
                <Select
                  value={filters.lifecycleStage || ANY}
                  onValueChange={(v) => setFilter("lifecycleStage", v === ANY ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any stage</SelectItem>
                    {LIFECYCLE_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {LIFECYCLE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Owner</Label>
                <Select
                  value={filters.ownerId || ANY}
                  onValueChange={(v) => setFilter("ownerId", v === ANY ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any owner</SelectItem>
                    {owners.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Select
                  value={filters.companyId || ANY}
                  onValueChange={(v) => setFilter("companyId", v === ANY ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any company</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="sg-after">Created after</Label>
                  <Input
                    id="sg-after"
                    type="date"
                    value={filters.createdAfter ?? ""}
                    onChange={(e) => setFilter("createdAfter", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sg-before">Before</Label>
                  <Input
                    id="sg-before"
                    type="date"
                    value={filters.createdBefore ?? ""}
                    onChange={(e) => setFilter("createdBefore", e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              {previewing ? (
                <span className="text-muted-foreground">Calculating matches…</span>
              ) : (
                <span>
                  <strong>{preview ?? 0}</strong> matching contact{preview === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create segment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
