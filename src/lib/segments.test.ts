import { describe, it, expect } from "vitest";
import { buildContactWhere, describeSegment } from "./segments";

describe("buildContactWhere", () => {
  it("returns empty where for no filters", () => {
    expect(buildContactWhere({})).toEqual({});
  });

  it("filters by lifecycle stage", () => {
    expect(buildContactWhere({ lifecycleStage: "CUSTOMER" })).toEqual({
      lifecycleStage: "CUSTOMER",
    });
  });

  it("combines owner and company filters", () => {
    const where = buildContactWhere({ ownerId: "u1", companyId: "c1" });
    expect(where.ownerId).toBe("u1");
    expect(where.companyId).toBe("c1");
  });

  it("builds a date range from createdAfter/createdBefore", () => {
    const where = buildContactWhere({
      createdAfter: "2025-01-01",
      createdBefore: "2025-02-01",
    });
    expect(where.createdAt).toBeDefined();
    const range = where.createdAt as { gte?: Date; lte?: Date };
    expect(range.gte).toBeInstanceOf(Date);
    expect(range.lte).toBeInstanceOf(Date);
  });

  it("ignores empty-string lifecycle", () => {
    const where = buildContactWhere({ lifecycleStage: "" as unknown as undefined });
    expect(where.lifecycleStage).toBeUndefined();
  });
});

describe("describeSegment", () => {
  it("describes all contacts when empty", () => {
    expect(describeSegment({})).toBe("All contacts");
  });
  it("describes a lifecycle filter", () => {
    expect(describeSegment({ lifecycleStage: "MQL" })).toContain("MQL");
  });
});
