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
import { Loader2 } from "lucide-react";

export interface CampaignFormData {
  id?: string;
  name: string;
  subject: string;
  body: string;
  fromName: string;
  segmentId: string;
}

interface Option {
  id: string;
  name: string;
}

export function CampaignDialog({
  open,
  onOpenChange,
  campaign,
  segments,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaign?: CampaignFormData;
  segments: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(campaign?.id);
  const [form, setForm] = useState<CampaignFormData>(
    campaign ?? {
      name: "",
      subject: "",
      body: "<p>Hi there,</p>\n<p>…</p>\n<p><a href=\"https://nexuscrm.test\">Learn more</a></p>",
      fromName: "NexusCRM",
      segmentId: "",
    },
  );

  function set<K extends keyof CampaignFormData>(key: K, value: CampaignFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.segmentId) {
      toast({ variant: "destructive", title: "Select a segment to target" });
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await apiFetch(`/api/campaigns/${campaign!.id}`, { method: "PATCH", json: form });
        toast({ title: "Campaign updated" });
      } else {
        await apiFetch("/api/campaigns", { method: "POST", json: form });
        toast({ title: "Campaign created" });
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save campaign",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit campaign" : "New campaign"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cp-name">Campaign name</Label>
              <Input
                id="cp-name"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Target segment</Label>
              <Select value={form.segmentId} onValueChange={(v) => set("segmentId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a segment" />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cp-from">From name</Label>
              <Input
                id="cp-from"
                required
                value={form.fromName}
                onChange={(e) => set("fromName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-subject">Subject</Label>
              <Input
                id="cp-subject"
                required
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-body">Email body (HTML)</Label>
            <Textarea
              id="cp-body"
              required
              rows={8}
              className="font-mono text-xs"
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Links become click-tracked and an open pixel is added automatically.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
