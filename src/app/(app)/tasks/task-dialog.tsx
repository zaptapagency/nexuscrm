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
import { PRIORITIES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

export interface TaskFormData {
  id?: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: string;
  assigneeId?: string | null;
  contactId?: string | null;
  dealId?: string | null;
}

interface Option {
  id: string;
  name: string;
}

const NONE = "__none__";

export function TaskDialog({
  open,
  onOpenChange,
  task,
  assignees,
  contacts,
  deals,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task?: TaskFormData;
  assignees: Option[];
  contacts: Option[];
  deals: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(task?.id);
  const [form, setForm] = useState<TaskFormData>(
    task ?? {
      title: "",
      description: "",
      dueDate: "",
      priority: "MEDIUM",
      assigneeId: "",
      contactId: "",
      dealId: "",
    },
  );

  function set<K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        dueDate: form.dueDate || undefined,
        priority: form.priority,
        assigneeId: form.assigneeId || undefined,
        contactId: form.contactId || undefined,
        dealId: form.dealId || undefined,
      };
      if (isEdit) {
        await apiFetch(`/api/tasks/${task!.id}`, { method: "PATCH", json: payload });
        toast({ title: "Task updated" });
      } else {
        await apiFetch("/api/tasks", { method: "POST", json: payload });
        toast({ title: "Task created" });
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save task",
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
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="t-title">Title</Label>
            <Input
              id="t-title"
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea
              id="t-desc"
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="t-due">Due date</Label>
              <Input
                id="t-due"
                type="date"
                value={form.dueDate ? form.dueDate.slice(0, 10) : ""}
                onChange={(e) => set("dueDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Label>Deal</Label>
              <Select
                value={form.dealId || NONE}
                onValueChange={(v) => set("dealId", v === NONE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link deal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {deals.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
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
              {isEdit ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
