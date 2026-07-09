"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/client-api";
import { Loader2, Upload } from "lucide-react";

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function reset() {
    setText("");
    setResult(null);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setText(await file.text());
    e.target.value = "";
  }

  async function submit() {
    if (!text.trim()) return;
    setImporting(true);
    setResult(null);
    try {
      const data = await apiFetch<ImportResult>("/api/contacts/import", {
        method: "POST",
        json: { text },
      });
      setResult(data);
      toast({ title: `Imported ${data.created + data.updated} contact(s)` });
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import contacts</DialogTitle>
          <DialogDescription>
            Paste CSV content or upload a file. Required column: email. Optional: first name,
            last name, phone, job title, lifecycle stage, company.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="csv-text">CSV content</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> Choose file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>
          <Textarea
            id="csv-text"
            rows={8}
            placeholder="firstName,lastName,email,company&#10;Jane,Doe,jane@acme.com,Acme Inc."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {result && (
            <div className="rounded-md border bg-muted/50 p-3 text-sm">
              <p>
                Created {result.created}, updated {result.updated}, skipped {result.skipped}.
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 max-h-32 list-disc space-y-1 overflow-y-auto pl-4 text-xs text-muted-foreground">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={submit} disabled={importing || !text.trim()}>
            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
