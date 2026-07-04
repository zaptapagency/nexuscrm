import { DEAL_STAGES, type DealStage } from "./constants";
import { startOfWeek, format } from "date-fns";

export interface DealLike {
  stage: string;
  amount: number;
  closedAt?: Date | string | null;
  createdAt: Date | string;
}

export interface ContactLike {
  createdAt: Date | string;
}

export interface TicketLike {
  status: string;
}

/** Sum of open pipeline value grouped by stage. */
export function pipelineByStage(deals: DealLike[]): { stage: DealStage; label: string; value: number; count: number }[] {
  const totals = new Map<string, { value: number; count: number }>();
  for (const stage of DEAL_STAGES) totals.set(stage, { value: 0, count: 0 });
  for (const d of deals) {
    const entry = totals.get(d.stage);
    if (entry) {
      entry.value += d.amount;
      entry.count += 1;
    }
  }
  return DEAL_STAGES.map((stage) => ({
    stage,
    label: stage
      .split("_")
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join(" "),
    value: totals.get(stage)!.value,
    count: totals.get(stage)!.count,
  }));
}

/** Win rate = won / (won + lost). Returns 0..1. */
export function winRate(deals: DealLike[]): number {
  const won = deals.filter((d) => d.stage === "CLOSED_WON").length;
  const lost = deals.filter((d) => d.stage === "CLOSED_LOST").length;
  const total = won + lost;
  return total === 0 ? 0 : won / total;
}

/** Total value of open (not closed) deals. */
export function openPipelineValue(deals: DealLike[]): number {
  return deals
    .filter((d) => d.stage !== "CLOSED_WON" && d.stage !== "CLOSED_LOST")
    .reduce((sum, d) => sum + d.amount, 0);
}

export function wonValue(deals: DealLike[]): number {
  return deals.filter((d) => d.stage === "CLOSED_WON").reduce((sum, d) => sum + d.amount, 0);
}

/** Deals won vs lost grouped by ISO week of their closedAt date. */
export function wonLostOverTime(
  deals: DealLike[],
): { week: string; won: number; lost: number }[] {
  const buckets = new Map<string, { won: number; lost: number }>();
  for (const d of deals) {
    if (d.stage !== "CLOSED_WON" && d.stage !== "CLOSED_LOST") continue;
    const date = d.closedAt ? new Date(d.closedAt) : new Date(d.createdAt);
    const wk = format(startOfWeek(date, { weekStartsOn: 1 }), "MMM d");
    const entry = buckets.get(wk) ?? { won: 0, lost: 0 };
    if (d.stage === "CLOSED_WON") entry.won += 1;
    else entry.lost += 1;
    buckets.set(wk, entry);
  }
  return Array.from(buckets.entries())
    .map(([week, v]) => ({ week, ...v }))
    .sort((a, b) => new Date(a.week + ", 2000").getTime() - new Date(b.week + ", 2000").getTime());
}

/** New contacts grouped by ISO week. */
export function contactsPerWeek(contacts: ContactLike[]): { week: string; count: number }[] {
  const buckets = new Map<string, number>();
  for (const c of contacts) {
    const wk = format(startOfWeek(new Date(c.createdAt), { weekStartsOn: 1 }), "MMM d");
    buckets.set(wk, (buckets.get(wk) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => new Date(a.week + ", 2000").getTime() - new Date(b.week + ", 2000").getTime());
}

/** Ticket counts grouped by status. */
export function ticketsByStatus(tickets: TicketLike[]): { status: string; count: number }[] {
  const buckets = new Map<string, number>();
  for (const t of tickets) {
    buckets.set(t.status, (buckets.get(t.status) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([status, count]) => ({ status, count }));
}

export interface RepDeal extends DealLike {
  ownerId?: string | null;
  ownerName?: string | null;
}

/** Leaderboard of reps by closed-won value. */
export function repLeaderboard(
  deals: RepDeal[],
): { ownerId: string; name: string; wonValue: number; wonCount: number }[] {
  const buckets = new Map<string, { name: string; wonValue: number; wonCount: number }>();
  for (const d of deals) {
    if (d.stage !== "CLOSED_WON" || !d.ownerId) continue;
    const entry = buckets.get(d.ownerId) ?? {
      name: d.ownerName ?? "Unknown",
      wonValue: 0,
      wonCount: 0,
    };
    entry.wonValue += d.amount;
    entry.wonCount += 1;
    buckets.set(d.ownerId, entry);
  }
  return Array.from(buckets.entries())
    .map(([ownerId, v]) => ({ ownerId, ...v }))
    .sort((a, b) => b.wonValue - a.wonValue);
}
