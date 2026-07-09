"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/client-api";
import type { FormField } from "@/lib/validations";
import { CheckCircle2, Loader2 } from "lucide-react";

export function PublicForm({
  slug,
  name,
  description,
  submitText,
  fields,
}: {
  slug: string;
  name: string;
  description: string | null;
  submitText: string;
  fields: FormField[];
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  function set(id: string, value: string) {
    setValues((v) => ({ ...v, [id]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const res = await apiFetch<{ successMessage: string }>(
        `/api/forms/public/${slug}/submit`,
        { method: "POST", json: { values } },
      );
      setDone(res.successMessage);
    } catch (err) {
      if (err instanceof ApiError && err.issues) {
        const flat: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(err.issues)) {
          flat[key] = msgs[0];
        }
        setErrors(flat);
      } else {
        setErrors({ _form: err instanceof Error ? err.message : "Something went wrong." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
          <p className="text-lg font-medium">{done}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.id}
                  placeholder={field.placeholder}
                  value={values[field.id] ?? ""}
                  onChange={(e) => set(field.id, e.target.value)}
                />
              ) : field.type === "dropdown" ? (
                <Select
                  value={values[field.id] ?? ""}
                  onValueChange={(v) => set(field.id, v)}
                >
                  <SelectTrigger id={field.id}>
                    <SelectValue placeholder={field.placeholder || "Select an option"} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.id}
                  type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
                  placeholder={field.placeholder}
                  value={values[field.id] ?? ""}
                  onChange={(e) => set(field.id, e.target.value)}
                />
              )}
              {errors[field.id] && (
                <p className="text-xs text-destructive">{errors[field.id]}</p>
              )}
            </div>
          ))}

          {errors._form && <p className="text-sm text-destructive">{errors._form}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
