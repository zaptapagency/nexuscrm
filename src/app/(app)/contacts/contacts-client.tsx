"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LifecycleBadge } from "@/components/status-badges";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { useToast } from "@/components/ui/use-toast";
import { useQueryParams } from "@/hooks/use-query-params";
import { apiFetch } from "@/lib/client-api";
import { canDelete } from "@/lib/rbac";
import { LIFECYCLE_STAGES, LIFECYCLE_LABELS } from "@/lib/constants";
import { ContactDialog, type ContactFormData } from "./contact-dialog";
import { ImportDialog } from "./import-dialog";
import {
  Users,
  Plus,
  Search,
  Upload,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
} from "lucide-react";

interface Row extends ContactFormData {
  id: string;
  company: { id: string; name: string } | null;
  owner: { id: string; name: string; avatarColor: string } | null;
  createdAt: string;
}

interface Option {
  id: string;
  name: string;
}

export function ContactsClient({
  contacts,
  companies,
  owners,
  total,
  page,
  totalPages,
  currentSort,
  currentDir,
}: {
  contacts: Row[];
  companies: Option[];
  owners: Option[];
  total: number;
  page: number;
  totalPages: number;
  currentSort: string;
  currentDir: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const allowDelete = canDelete(session?.user.role);
  const { searchParams, setParams } = useQueryParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContactFormData | undefined>();
  const [importOpen, setImportOpen] = useState(false);

  // Debounced search -> URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((searchParams.get("q") ?? "") !== search) {
        setParams({ q: search || undefined });
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function toggleSort(field: string) {
    const dir = currentSort === field && currentDir === "asc" ? "desc" : "asc";
    setParams({ sort: field, dir }, false);
  }

  function toggleAll() {
    if (selected.size === contacts.length) setSelected(new Set());
    else setSelected(new Set(contacts.map((c) => c.id)));
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} selected contact(s)? This cannot be undone.`)) return;
    try {
      await apiFetch("/api/contacts/bulk-delete", {
        method: "POST",
        json: { ids: Array.from(selected) },
      });
      toast({ title: `Deleted ${selected.size} contact(s)` });
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async function deleteOne(id: string) {
    if (!confirm("Delete this contact?")) return;
    try {
      await apiFetch(`/api/contacts/${id}`, { method: "DELETE" });
      toast({ title: "Contact deleted" });
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search contacts"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={searchParams.get("lifecycleStage") ?? "all"}
            onValueChange={(v) => setParams({ lifecycleStage: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {LIFECYCLE_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {LIFECYCLE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={searchParams.get("ownerId") ?? "all"}
            onValueChange={(v) => setParams({ ownerId: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              {owners.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/api/contacts/export">
              <Download className="h-4 w-4" /> Export
            </a>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New contact
          </Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-accent px-4 py-2 text-sm">
          <span>{selected.size} selected</span>
          {allowDelete ? (
            <Button variant="destructive" size="sm" onClick={bulkDelete}>
              <Trash2 className="h-4 w-4" /> Delete selected
            </Button>
          ) : (
            <span className="text-muted-foreground">Your role can't delete records</span>
          )}
        </div>
      )}

      {contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts found"
          description="Try adjusting your filters, or add your first contact to get started."
          action={
            <Button
              onClick={() => {
                setEditing(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New contact
            </Button>
          }
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selected.size === contacts.length && contacts.length > 0}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("lastName")}>
                    Name <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("email")}>
                    Email <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Company</TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1"
                    onClick={() => toggleSort("lifecycleStage")}
                  >
                    Stage <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id} data-state={selected.has(c.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(c.id)}
                      onCheckedChange={() => toggleOne(c.id)}
                      aria-label={`Select ${c.firstName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/contacts/${c.id}`} className="font-medium hover:text-primary">
                      {c.firstName} {c.lastName}
                    </Link>
                    {c.jobTitle && (
                      <div className="text-xs text-muted-foreground">{c.jobTitle}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell>
                    {c.company ? (
                      <Link href={`/companies/${c.company.id}`} className="hover:text-primary">
                        {c.company.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <LifecycleBadge stage={c.lifecycleStage} />
                  </TableCell>
                  <TableCell>
                    {c.owner ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar name={c.owner.name} color={c.owner.avatarColor} className="h-6 w-6" />
                        <span className="text-sm">{c.owner.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Row actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing({
                              id: c.id,
                              firstName: c.firstName,
                              lastName: c.lastName,
                              email: c.email,
                              phone: c.phone,
                              jobTitle: c.jobTitle,
                              lifecycleStage: c.lifecycleStage,
                              companyId: c.companyId,
                              ownerId: c.ownerId,
                            });
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Edit
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} />

      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={editing}
        companies={companies}
        owners={owners}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
