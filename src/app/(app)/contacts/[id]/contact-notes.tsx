"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/client-api";
import { relativeTime } from "@/lib/utils";
import { Loader2, StickyNote } from "lucide-react";

export interface NoteItem {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string; avatarColor: string } | null;
}

export function ContactNotes({
  contactId,
  initialNotes,
}: {
  contactId: string;
  initialNotes: NoteItem[];
}) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    try {
      const note = await apiFetch<NoteItem>("/api/notes", {
        method: "POST",
        json: { body, contactId },
      });
      setNotes((prev) => [note, ...prev]);
      setBody("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not add note",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2">
        <Textarea
          rows={3}
          placeholder="Add a note about this contact…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="Note body"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={saving || !body.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Add note
          </Button>
        </div>
      </form>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
          <StickyNote className="h-6 w-6" />
          No notes yet.
        </div>
      ) : (
        <ul className="space-y-4">
          {notes.map((note) => (
            <li key={note.id} className="flex gap-3">
              <UserAvatar
                name={note.author?.name ?? "Unknown"}
                color={note.author?.avatarColor}
                className="h-8 w-8 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{note.author?.name ?? "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(note.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">
                  {note.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
