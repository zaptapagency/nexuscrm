"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PriorityBadge } from "@/components/status-badges";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { useQueryParams } from "@/hooks/use-query-params";
import { apiFetch } from "@/lib/client-api";
import { canDelete } from "@/lib/rbac";
import { cn, formatDate } from "@/lib/utils";
import { PRIORITIES } from "@/lib/constants";
import { TaskDialog, type TaskFormData } from "./task-dialog";
import {
  CheckSquare,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  CalendarClock,
} from "lucide-react";

interface Row {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  completed: boolean;
  assigneeId: string | null;
  contactId: string | null;
  dealId: string | null;
  assignee: { id: string; name: string; avatarColor: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  deal: { id: string; name: string } | null;
}

interface Option {
  id: string;
  name: string;
}

const STATUS_TABS = [
  { value: "open", label: "Open" },
  { value: "done", label: "Completed" },
  { value: "all", label: "All" },
];

export function TasksClient({
  initialTasks,
  assignees,
  contacts,
  deals,
}: {
  initialTasks: Row[];
  assignees: Option[];
  contacts: Option[];
  deals: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const allowDelete = canDelete(session?.user.role);
  const { searchParams, setParams } = useQueryParams();

  const [tasks, setTasks] = useState<Row[]>(initialTasks);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskFormData | undefined>();

  useEffect(() => setTasks(initialTasks), [initialTasks]);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((searchParams.get("q") ?? "") !== search) {
        setParams({ q: search || undefined });
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const status = searchParams.get("status") ?? "open";

  async function toggleComplete(task: Row) {
    const next = !task.completed;
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, completed: next } : t)));
    try {
      await apiFetch(`/api/tasks/${task.id}`, { method: "PATCH", json: { completed: next } });
      router.refresh();
    } catch (err) {
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, completed: !next } : t)));
      toast({
        variant: "destructive",
        title: "Could not update task",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async function deleteOne(id: string) {
    if (!confirm("Delete this task?")) return;
    const prev = tasks;
    setTasks((ts) => ts.filter((t) => t.id !== id));
    try {
      await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
      toast({ title: "Task deleted" });
      router.refresh();
    } catch (err) {
      setTasks(prev);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  function isOverdue(row: Row) {
    return !row.completed && row.dueDate && new Date(row.dueDate) < new Date();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setParams({ status: tab.value === "open" ? undefined : tab.value })}
              className={cn(
                "rounded-md px-3 py-1 text-sm transition-colors",
                status === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tasks"
            />
          </div>
          <Select
            value={searchParams.get("priority") ?? "all"}
            onValueChange={(v) => setParams({ priority: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={searchParams.get("assigneeId") ?? "all"}
            onValueChange={(v) => setParams({ assigneeId: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              {assignees.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
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
            <Plus className="h-4 w-4" /> New task
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks here"
          description="Create a task to keep track of your follow-ups."
          action={
            <Button
              onClick={() => {
                setEditing(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New task
            </Button>
          }
        />
      ) : (
        <Card className="divide-y p-0">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 p-3.5">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleComplete(task)}
                aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      task.completed && "text-muted-foreground line-through",
                    )}
                  >
                    {task.title}
                  </span>
                  <PriorityBadge priority={task.priority} />
                </div>
                {task.description && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {task.description}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {task.dueDate && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        isOverdue(task) && "font-medium text-destructive",
                      )}
                    >
                      <CalendarClock className="h-3 w-3" />
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                  {task.contact && (
                    <Link href={`/contacts/${task.contact.id}`} className="hover:text-primary">
                      {task.contact.firstName} {task.contact.lastName}
                    </Link>
                  )}
                  {task.deal && <span>Deal: {task.deal.name}</span>}
                </div>
              </div>
              {task.assignee && (
                <UserAvatar
                  name={task.assignee.name}
                  color={task.assignee.avatarColor}
                  className="h-7 w-7"
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Task actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing({
                        id: task.id,
                        title: task.title,
                        description: task.description,
                        dueDate: task.dueDate,
                        priority: task.priority,
                        assigneeId: task.assigneeId,
                        contactId: task.contactId,
                        dealId: task.dealId,
                      });
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  {allowDelete && (
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteOne(task.id)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </Card>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        assignees={assignees}
        contacts={contacts}
        deals={deals}
      />
    </div>
  );
}
