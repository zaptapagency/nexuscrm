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
import { UserAvatar } from "@/components/user-avatar";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/client-api";
import { canDelete } from "@/lib/rbac";
import { cn, formatCurrency } from "@/lib/utils";
import { DEAL_STAGES, DEAL_STAGE_LABELS } from "@/lib/constants";
import { DealDialog, type DealFormData } from "./deal-dialog";
import { MoreHorizontal, Pencil, Trash2, Plus, GripVertical } from "lucide-react";

export interface BoardDeal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  closeDate: string | null;
  contactId: string | null;
  companyId: string | null;
  ownerId: string | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  company: { id: string; name: string } | null;
  owner: { id: string; name: string; avatarColor: string } | null;
}

interface Option {
  id: string;
  name: string;
}

export function DealsBoard({
  initialDeals,
  contacts,
  companies,
  owners,
}: {
  initialDeals: BoardDeal[];
  contacts: Option[];
  companies: Option[];
  owners: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const allowDelete = canDelete(session?.user.role);

  const [deals, setDeals] = useState<BoardDeal[]>(initialDeals);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DealFormData | undefined>();
  const [createStage, setCreateStage] = useState<string | undefined>();

  async function moveDeal(id: string, stage: string) {
    const current = deals.find((d) => d.id === id);
    if (!current || current.stage === stage) return;

    const prev = deals;
    setDeals((ds) => ds.map((d) => (d.id === id ? { ...d, stage } : d)));
    try {
      await apiFetch(`/api/deals/${id}/stage`, { method: "PATCH", json: { stage } });
      router.refresh();
    } catch (err) {
      setDeals(prev);
      toast({
        variant: "destructive",
        title: "Could not move deal",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async function deleteOne(id: string) {
    if (!confirm("Delete this deal?")) return;
    const prev = deals;
    setDeals((ds) => ds.filter((d) => d.id !== id));
    try {
      await apiFetch(`/api/deals/${id}`, { method: "DELETE" });
      toast({ title: "Deal deleted" });
      router.refresh();
    } catch (err) {
      setDeals(prev);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  function openCreate(stage: string) {
    setEditing(undefined);
    setCreateStage(stage);
    setDialogOpen(true);
  }

  function openEdit(d: BoardDeal) {
    setEditing({
      id: d.id,
      name: d.name,
      amount: d.amount,
      stage: d.stage,
      closeDate: d.closeDate,
      contactId: d.contactId,
      companyId: d.companyId,
      ownerId: d.ownerId,
    });
    setCreateStage(undefined);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.amount, 0);
          return (
            <div
              key={stage}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30 transition-colors",
                overStage === stage && "border-primary bg-primary/5",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setOverStage(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setOverStage(null);
                if (dragId) moveDeal(dragId, stage);
                setDragId(null);
              }}
            >
              <div className="flex items-center justify-between border-b px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{DEAL_STAGE_LABELS[stage]}</p>
                  <p className="text-xs text-muted-foreground">
                    {stageDeals.length} · {formatCurrency(stageValue)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openCreate(stage)}
                  aria-label={`Add deal to ${DEAL_STAGE_LABELS[stage]}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 space-y-2 p-2">
                {stageDeals.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">Drop deals here</p>
                ) : (
                  stageDeals.map((d) => (
                    <Card
                      key={d.id}
                      draggable
                      onDragStart={() => setDragId(d.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStage(null);
                      }}
                      className={cn(
                        "group cursor-grab p-3 active:cursor-grabbing",
                        dragId === d.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{d.name}</p>
                          {d.company && (
                            <p className="truncate text-xs text-muted-foreground">
                              {d.company.name}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              aria-label="Deal actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(d)}>
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            {allowDelete && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteOne(d.id)}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(d.amount)}
                        </span>
                        {d.owner ? (
                          <UserAvatar
                            name={d.owner.name}
                            color={d.owner.avatarColor}
                            className="h-6 w-6"
                          />
                        ) : (
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      {d.contact && (
                        <Link
                          href={`/contacts/${d.contact.id}`}
                          className="mt-1 block text-xs text-muted-foreground hover:text-primary"
                        >
                          {d.contact.firstName} {d.contact.lastName}
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

      <DealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        deal={editing}
        defaultStage={createStage}
        contacts={contacts}
        companies={companies}
        owners={owners}
      />
    </>
  );
}
