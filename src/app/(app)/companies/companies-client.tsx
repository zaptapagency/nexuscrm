"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { useToast } from "@/components/ui/use-toast";
import { useQueryParams } from "@/hooks/use-query-params";
import { apiFetch } from "@/lib/client-api";
import { canDelete } from "@/lib/rbac";
import { INDUSTRIES } from "@/lib/constants";
import { CompanyDialog, type CompanyFormData } from "./company-dialog";
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
} from "lucide-react";

interface Row extends CompanyFormData {
  id: string;
  owner: { id: string; name: string; avatarColor: string } | null;
  _count: { contacts: number; deals: number };
}

interface Option {
  id: string;
  name: string;
}

export function CompaniesClient({
  companies,
  owners,
  total,
  page,
  totalPages,
  currentSort,
  currentDir,
}: {
  companies: Row[];
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyFormData | undefined>();

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

  async function deleteOne(id: string) {
    if (!confirm("Delete this company? Contacts and deals will be unlinked.")) return;
    try {
      await apiFetch(`/api/companies/${id}`, { method: "DELETE" });
      toast({ title: "Company deleted" });
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
            placeholder="Search companies…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search companies"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={searchParams.get("industry") ?? "all"}
            onValueChange={(v) => setParams({ industry: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
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
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New company
          </Button>
        </div>
      </div>

      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies found"
          description="Try adjusting your filters, or add your first company to get started."
          action={
            <Button
              onClick={() => {
                setEditing(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New company
            </Button>
          }
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                    Name <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("industry")}>
                    Industry <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Contacts</TableHead>
                <TableHead className="text-right">Deals</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("city")}>
                    Location <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/companies/${c.id}`} className="font-medium hover:text-primary">
                      {c.name}
                    </Link>
                    {c.domain && (
                      <div className="text-xs text-muted-foreground">{c.domain}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.industry || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{c._count.contacts}</TableCell>
                  <TableCell className="text-right tabular-nums">{c._count.deals}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {[c.city, c.country].filter(Boolean).join(", ") || "—"}
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
                              name: c.name,
                              domain: c.domain,
                              industry: c.industry,
                              size: c.size,
                              phone: c.phone,
                              city: c.city,
                              country: c.country,
                              website: c.website,
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

      <CompanyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={editing}
        owners={owners}
      />
    </div>
  );
}
