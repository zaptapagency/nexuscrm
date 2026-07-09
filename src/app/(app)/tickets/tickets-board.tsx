"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityBadge } from "@/components/status-badges";
import { UserAvatar } from "@/components/user-avatar";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/client-api";
import { canDelete } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { TICKET_STATUSES, TICKET_STATUS_LABELS } from "@/lib/constants";
import { TicketDialog, type TicketFormData } from "./ticket-dialog";
import { MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react";

export interface BoardTicket {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  contactId: string | null;
  assigneeId: string | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  assignee: { id: string; name: string; avatarColor: string } | null;
}

interface Option {
  id: string;
  name: string;
}

export function TicketsBoard({
  initialTickets,
  contacts,
  assignees,
}: {
  initialTickets: BoardTicket[];
  contacts: Option[];
  assignees: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const allowDelete = canDelete(session?.user.role);

  const [tickets, setTickets] = useState<BoardTicket[]>(initialTickets);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TicketFormData | undefined>();
  const [createStatus, setCreateStatus] = useState<string | undefined>();

  async function moveTicket(id: string, status: string) {
    const current = tickets.find((t) => t.id === id);
    if (!current || current.status === status) return;

    const prev = tickets;
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await apiFetch(`/api/tickets/${id}/status`, { method: "PATCH", json: { status } });
      router.refresh();
    } catch (err) {
      setTickets(prev);
      toast({
        variant: "destructive",
        title: "Could not move ticket",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async function deleteOne(id: string) {
    if (!confirm("Delete this ticket?")) return;
    const prev = tickets;
    setTickets((ts) => ts.filter((t) => t.id !== id));
    try {
      await apiFetch(`/api/tickets/${id}`, { method: "DELETE" });
      toast({ title: "Ticket deleted" });
      router.refresh();
    } catch (err) {
      setTickets(prev);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  function openCreate(status: string) {
    setEditing(undefined);
    setCreateStatus(status);
    setDialogOpen(true);
  }

  function openEdit(t: BoardTicket) {
    setEditing({
      id: t.id,
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      contactId: t.contactId,
      assigneeId: t.assigneeId,
    });
    setCreateStatus(undefined);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TICKET_STATUSES.map((status) => {
          const columnTickets = tickets.filter((t) => t.status === status);
          return (
            <div
              key={status}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30 transition-colors",
                overStatus === status && "border-primary bg-primary/5",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStatus(status);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setOverStatus(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setOverStatus(null);
                if (dragId) moveTicket(dragId, status);
                setDragId(null);
              }}
            >
              <div className="flex items-center justify-between border-b px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{TICKET_STATUS_LABELS[status]}</p>
                  <p className="text-xs text-muted-foreground">{columnTickets.length} tickets</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openCreate(status)}
                  aria-label={`Add ticket to ${TICKET_STATUS_LABELS[status]}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 space-y-2 p-2">
                {columnTickets.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">Drop tickets here</p>
                ) : (
                  columnTickets.map((t) => (
                    <Card
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStatus(null);
                      }}
                      className={cn(
                        "group cursor-grab p-3 active:cursor-grabbing",
                        dragId === t.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 text-sm font-medium">{t.subject}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              aria-label="Ticket actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(t)}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            {allowDelete && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteOne(t.id)}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <PriorityBadge priority={t.priority} />
                        {t.assignee && (
                          <UserAvatar
                            name={t.assignee.name}
                            color={t.assignee.avatarColor}
                            className="h-6 w-6"
                          />
                        )}
                      </div>
                      {t.contact && (
                        <Link
                          href={`/contacts/${t.contact.id}`}
                          className="mt-1 block text-xs text-muted-foreground hover:text-primary"
                        >
                          {t.contact.firstName} {t.contact.lastName}
                        </Link>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TicketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ticket={editing}
        defaultStatus={createStatus}
        contacts={contacts}
        assignees={assignees}
      />
    </>
  );
}
