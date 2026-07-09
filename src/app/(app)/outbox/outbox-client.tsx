"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { relativeTime, formatDateTime } from "@/lib/utils";
import { Inbox, Mail } from "lucide-react";

export interface OutboxRow {
  id: string;
  toEmail: string;
  toName: string | null;
  fromName: string;
  subject: string;
  body: string;
  createdAt: string;
}

export function OutboxClient({ emails }: { emails: OutboxRow[] }) {
  const [selected, setSelected] = useState<OutboxRow | null>(null);

  if (emails.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Outbox is empty"
        description="Send a campaign and the delivered emails will show up here."
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        {emails.map((e) => (
          <Card
            key={e.id}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => setSelected(e)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-md bg-muted p-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.subject}</p>
                <p className="truncate text-sm text-muted-foreground">
                  To {e.toName ? `${e.toName} <${e.toEmail}>` : e.toEmail} · from {e.fromName}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {relativeTime(e.createdAt)}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="space-y-1 border-b pb-3 text-sm">
                <div className="flex gap-2">
                  <span className="w-16 text-muted-foreground">From</span>
                  <span>{selected.fromName}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16 text-muted-foreground">To</span>
                  <span>
                    {selected.toName ? `${selected.toName} <${selected.toEmail}>` : selected.toEmail}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16 text-muted-foreground">Date</span>
                  <span>{formatDateTime(selected.createdAt)}</span>
                </div>
              </div>
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={selected.body}
                className="h-[420px] w-full rounded-md border bg-white"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
