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
import { INDUSTRIES, COMPANY_SIZES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

export interface CompanyFormData {
  id?: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  website?: string | null;
  ownerId?: string | null;
}

interface Option {
  id: string;
  name: string;
}

const NONE = "__none__";

export function CompanyDialog({
  open,
  onOpenChange,
  company,
  owners,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  company?: CompanyFormData;
  owners: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(company?.id);
  const [form, setForm] = useState<CompanyFormData>(
    company ?? {
      name: "",
      domain: "",
      industry: "",
      size: "",
      phone: "",
      city: "",
      country: "",
      website: "",
      ownerId: "",
    },
  );

  function set<K extends keyof CompanyFormData>(key: K, value: CompanyFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        domain: form.domain || undefined,
        industry: form.industry || undefined,
        size: form.size || undefined,
        phone: form.phone || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        website: form.website || undefined,
        ownerId: form.ownerId || undefined,
      };
      if (isEdit) {
        await apiFetch(`/api/companies/${company!.id}`, { method: "PATCH", json: payload });
        toast({ title: "Company updated" });
      } else {
        await apiFetch("/api/companies", { method: "POST", json: payload });
        toast({ title: "Company created" });
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save company",
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
          <DialogTitle>{isEdit ? "Edit company" : "New company"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="co-name">Company name</Label>
            <Input
              id="co-name"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="co-domain">Domain</Label>
              <Input
                id="co-domain"
                placeholder="acme.com"
                value={form.domain ?? ""}
                onChange={(e) => set("domain", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-website">Website</Label>
              <Input
                id="co-website"
                placeholder="https://acme.com"
                value={form.website ?? ""}
                onChange={(e) => set("website", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select
                value={form.industry || NONE}
                onValueChange={(v) => set("industry", v === NONE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unspecified</SelectItem>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Size</Label>
              <Select
                value={form.size || NONE}
                onValueChange={(v) => set("size", v === NONE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unspecified</SelectItem>
                  {COMPANY_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="co-phone">Phone</Label>
              <Input
                id="co-phone"
                value={form.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
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
              <Label htmlFor="co-city">City</Label>
              <Input
                id="co-city"
                value={form.city ?? ""}
                onChange={(e) => set("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-country">Country</Label>
              <Input
                id="co-country"
                value={form.country ?? ""}
                onChange={(e) => set("country", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
