"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/client-api";
import { canDelete } from "@/lib/rbac";
import { formatDateTime, relativeTime } from "@/lib/utils";
import { CampaignDialog, type CampaignFormData } from "./campaign-dialog";
import {
  Megaphone,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  Loader2,
  MailOpen,
  MousePointerClick,
  Users,
} from "lucide-react";

interface Option {
  id: string;
  name: string;
}

export interface CampaignRow {
  id: string;
  name: string;
  subject: string;
  body: string;
  fromName: string;
  status: string;
  segmentId: string | null;
  segmentName: string | null;
  sentAt: string | null;
  createdAt: string;
  recipientCount: number;
  openedCount: number;
  clickedCount: number;
}

export function CampaignsClient({
  campaigns,
  segments,
}: {
  campaigns: CampaignRow[];
  segments: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const allowDelete = canDelete(session?.user.role);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CampaignFormData | undefined>();
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function send(c: CampaignRow) {
    if (
      !confirm(
        `Send "${c.name}" to everyone in the "${c.segmentName ?? "target"}" segment? This cannot be undone.`,
      )
    ) {
      return;
    }
    setSendingId(c.id);
    try {
      const res = await apiFetch<{ sent: number }>(`/api/campaigns/${c.id}/send`, {
        method: "POST",
      });
      toast({
        title: "Campaign sent",
        description: `Delivered to ${res.sent} recipient${res.sent === 1 ? "" : "s"}.`,
      });
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Send failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSendingId(null);
    }
  }

  async function deleteOne(id: string) {
    if (!confirm("Delete this campaign? Recipient tracking will be removed.")) return;
    try {
      await apiFetch(`/api/campaigns/${id}`, { method: "DELETE" });
      toast({ title: "Campaign deleted" });
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  function rate(part: number, total: number) {
    if (total === 0) return "0%";
    return `${Math.round((part / total) * 100)}%`;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Create an email campaign and target it at one of your segments."
          action={
            <Button
              onClick={() => {
                setEditing(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New campaign
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const isSent = c.status === "SENT";
            const isSending = sendingId === c.id;
            return (
              <Card key={c.id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/campaigns/${c.id}`}
                        className="truncate font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                      <Badge variant={isSent ? "default" : "secondary"}>
                        {isSent ? "Sent" : "Draft"}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{c.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.segmentName ? (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> {c.segmentName}
                        </span>
                      ) : (
                        <span className="text-destructive">No segment attached</span>
                      )}
                      {isSent && c.sentAt && <> · Sent {relativeTime(c.sentAt)}</>}
                    </p>
                  </div>

                  {isSent && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="flex items-center gap-1 font-medium">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {c.recipientCount}
                        </div>
                        <div className="text-xs text-muted-foreground">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 font-medium">
                          <MailOpen className="h-3.5 w-3.5 text-muted-foreground" />
                          {rate(c.openedCount, c.recipientCount)}
                        </div>
                        <div className="text-xs text-muted-foreground">Opened</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 font-medium">
                          <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
                          {rate(c.clickedCount, c.recipientCount)}
                        </div>
                        <div className="text-xs text-muted-foreground">Clicked</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {!isSent && (
                      <Button size="sm" disabled={isSending} onClick={() => send(c)}>
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Send
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Campaign actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!isSent && (
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing({
                                id: c.id,
                                name: c.name,
                                subject: c.subject,
                                body: c.body,
                                fromName: c.fromName,
                                segmentId: c.segmentId ?? "",
                              });
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={`/campaigns/${c.id}`}>
                            <MailOpen className="h-4 w-4" /> View report
                          </Link>
                        </DropdownMenuItem>
                        {allowDelete && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteOne(c.id)}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaign={editing}
        segments={segments}
      />
    </div>
  );
}
