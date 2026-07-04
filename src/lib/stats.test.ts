import { describe, it, expect } from "vitest";
import {
  pipelineByStage,
  winRate,
  openPipelineValue,
  wonValue,
  ticketsByStatus,
  repLeaderboard,
  contactsPerWeek,
} from "./stats";

const deals = [
  { stage: "PROSPECTING", amount: 1000, createdAt: "2025-01-01" },
  { stage: "QUALIFIED", amount: 2000, createdAt: "2025-01-02" },
  { stage: "CLOSED_WON", amount: 5000, createdAt: "2025-01-03", closedAt: "2025-01-10" },
  { stage: "CLOSED_WON", amount: 3000, createdAt: "2025-01-04", closedAt: "2025-01-11" },
  { stage: "CLOSED_LOST", amount: 4000, createdAt: "2025-01-05", closedAt: "2025-01-12" },
];

describe("pipelineByStage", () => {
  it("returns all six stages with correct totals", () => {
    const result = pipelineByStage(deals);
    expect(result).toHaveLength(6);
    expect(result.find((r) => r.stage === "PROSPECTING")!.value).toBe(1000);
    expect(result.find((r) => r.stage === "CLOSED_WON")!.value).toBe(8000);
    expect(result.find((r) => r.stage === "CLOSED_WON")!.count).toBe(2);
  });
});

describe("winRate", () => {
  it("computes won / (won + lost)", () => {
    expect(winRate(deals)).toBeCloseTo(2 / 3, 5);
  });
  it("returns 0 with no closed deals", () => {
    expect(winRate([{ stage: "PROSPECTING", amount: 1, createdAt: "2025-01-01" }])).toBe(0);
  });
});

describe("openPipelineValue", () => {
  it("sums only open deals", () => {
    expect(openPipelineValue(deals)).toBe(3000);
  });
});

describe("wonValue", () => {
  it("sums only won deals", () => {
    expect(wonValue(deals)).toBe(8000);
  });
});

describe("ticketsByStatus", () => {
  it("groups counts by status", () => {
    const result = ticketsByStatus([
      { status: "NEW" },
      { status: "NEW" },
      { status: "OPEN" },
    ]);
    expect(result.find((r) => r.status === "NEW")!.count).toBe(2);
    expect(result.find((r) => r.status === "OPEN")!.count).toBe(1);
  });
});

describe("repLeaderboard", () => {
  it("ranks reps by closed-won value", () => {
    const board = repLeaderboard([
      { stage: "CLOSED_WON", amount: 5000, createdAt: "2025-01-01", ownerId: "u1", ownerName: "Ann" },
      { stage: "CLOSED_WON", amount: 9000, createdAt: "2025-01-01", ownerId: "u2", ownerName: "Bob" },
      { stage: "CLOSED_LOST", amount: 100, createdAt: "2025-01-01", ownerId: "u1", ownerName: "Ann" },
    ]);
    expect(board[0].name).toBe("Bob");
    expect(board[0].wonValue).toBe(9000);
    expect(board[1].name).toBe("Ann");
  });
});

describe("contactsPerWeek", () => {
  it("buckets contacts by week", () => {
    const result = contactsPerWeek([
      { createdAt: "2025-01-06" },
      { createdAt: "2025-01-07" },
    ]);
    expect(result.reduce((sum, r) => sum + r.count, 0)).toBe(2);
  });
});
