"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SegmentDialog, type SegmentFormData } from "./segment-dialog";
import { Filter, Plus, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";

interface Row {
  id: string;
  name: string;
  description: string | null;
  filters: SegmentFormData["filters"];
  summary: string;
  matchCount: number;
  campaignCount: number;
}

interface Option {
  id: string;
  name: string;
}

export function SegmentsClient({
  segments,
  owners,
  companies,
}: {
  segments: Row[];
  owners: Option[];
  companies: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const allowDelete = canDelete(session?.user.role);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SegmentFormData | undefined>();

  async function deleteOne(id: string) {
    if (!confirm("Delete this segment? Linked campaigns will be unlinked.")) return;
    try {
      await apiFetch(`/api/segments/${id}`, { method: "DELETE" });
      toast({ title: "Segment deleted" });
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
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
          <Plus className="h-4 w-4" /> New segment
        </Button>
      </div>

      {segments.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No segments yet"
          description="Segments are saved contact filters you can target with campaigns."
          action={
            <Button
              onClick={() => {
                setEditing(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New segment
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((s) => (
            <Card key={s.id} className="flex flex-col">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <CardTitle className="text-base">{s.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Segment actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing({
                          id: s.id,
                          name: s.name,
                          description: s.description,
                          filters: s.filters,
                        });
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    {allowDelete && (
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteOne(s.id)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-3">
                <div>
                  {s.description && (
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">{s.summary}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" /> {s.matchCount} contacts
                  </Badge>
                  {s.campaignCount > 0 && (
                    <Badge variant="outline">{s.campaignCount} campaigns</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SegmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        segment={editing}
        owners={owners}
        companies={companies}
      />
    </div>
  );
}
