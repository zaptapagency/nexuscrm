"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";

export interface FormFieldData {
  id: string;
  type: "text" | "email" | "textarea" | "dropdown" | "phone";
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
  mapsTo: "firstName" | "lastName" | "email" | "phone" | "jobTitle" | "none";
}

export interface FormFormData {
  id?: string;
  name: string;
  description?: string | null;
  submitText: string;
  successMessage: string;
  published: boolean;
  fields: FormFieldData[];
}

const FIELD_TYPES: { value: FormFieldData["type"]; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "textarea", label: "Paragraph" },
  { value: "dropdown", label: "Dropdown" },
  { value: "phone", label: "Phone" },
];

const MAPS_TO: { value: FormFieldData["mapsTo"]; label: string }[] = [
  { value: "none", label: "Don't map" },
  { value: "firstName", label: "First name" },
  { value: "lastName", label: "Last name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "jobTitle", label: "Job title" },
];

function newField(): FormFieldData {
  return {
    id: Math.random().toString(36).slice(2, 10),
    type: "text",
    label: "",
    placeholder: "",
    required: true,
    options: [],
    mapsTo: "none",
  };
}

function emptyForm(): FormFormData {
  return {
    name: "",
    description: "",
    submitText: "Submit",
    successMessage: "Thanks! We'll be in touch soon.",
    published: true,
    fields: [
      { ...newField(), type: "text", label: "First name", mapsTo: "firstName" },
      { ...newField(), type: "text", label: "Last name", mapsTo: "lastName" },
      { ...newField(), type: "email", label: "Email", mapsTo: "email" },
    ],
  };
}

export function FormDialog({
  open,
  onOpenChange,
  form: initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  form?: FormFormData;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<FormFormData>(initial ?? emptyForm());

  function set<K extends keyof FormFormData>(key: K, value: FormFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateField(id: string, patch: Partial<FormFieldData>) {
    setForm((f) => ({
      ...f,
      fields: f.fields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    }));
  }

  function addField() {
    setForm((f) => ({ ...f, fields: [...f.fields, newField()] }));
  }

  function removeField(id: string) {
    setForm((f) => ({ ...f, fields: f.fields.filter((field) => field.id !== id) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.fields.length === 0) {
      toast({ variant: "destructive", title: "Add at least one field" });
      return;
    }
    if (form.fields.some((f) => !f.label.trim())) {
      toast({ variant: "destructive", title: "All fields need a label" });
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await apiFetch(`/api/forms/${initial!.id}`, { method: "PATCH", json: form });
        toast({ title: "Form updated" });
      } else {
        await apiFetch("/api/forms", { method: "POST", json: form });
        toast({ title: "Form created" });
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save form",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setForm(initial ?? emptyForm());
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit form" : "New form"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fm-name">Form name</Label>
              <Input
                id="fm-name"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fm-submit">Submit button text</Label>
              <Input
                id="fm-submit"
                required
                value={form.submitText}
                onChange={(e) => set("submitText", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fm-desc">Description (optional)</Label>
            <Textarea
              id="fm-desc"
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fm-success">Success message</Label>
            <Input
              id="fm-success"
              required
              value={form.successMessage}
              onChange={(e) => set("successMessage", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.published} onCheckedChange={(v) => set("published", v)} />
            <Label>Published (accepting submissions)</Label>
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label>Fields</Label>
              <Button type="button" size="sm" variant="outline" onClick={addField}>
                <Plus className="h-4 w-4" /> Add field
              </Button>
            </div>
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {form.fields.map((field) => (
                <div key={field.id} className="space-y-2 rounded-md border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="grid flex-1 grid-cols-2 gap-2">
                      <Input
                        placeholder="Label"
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                      />
                      <Select
                        value={field.type}
                        onValueChange={(v) =>
                          updateField(field.id, { type: v as FormFieldData["type"] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Placeholder (optional)"
                        value={field.placeholder}
                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                      />
                      <Select
                        value={field.mapsTo}
                        onValueChange={(v) =>
                          updateField(field.id, { mapsTo: v as FormFieldData["mapsTo"] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MAPS_TO.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive"
                      onClick={() => removeField(field.id)}
                      aria-label="Remove field"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {field.type === "dropdown" && (
                    <Input
                      placeholder="Comma-separated options"
                      value={field.options.join(", ")}
                      onChange={(e) =>
                        updateField(field.id, {
                          options: e.target.value
                            .split(",")
                            .map((o) => o.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  )}
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={field.required}
                      onCheckedChange={(v) => updateField(field.id, { required: Boolean(v) })}
                    />
                    Required
                  </label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create form"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
