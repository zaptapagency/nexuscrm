import { describe, it, expect } from "vitest";
import {
  signupSchema,
  contactSchema,
  dealSchema,
  ticketSchema,
  campaignSchema,
  formSchema,
  segmentFilterSchema,
} from "./validations";

describe("signupSchema", () => {
  it("accepts valid input and lowercases email", () => {
    const r = signupSchema.parse({ name: "Jane Doe", email: "JANE@X.COM", password: "supersecret" });
    expect(r.email).toBe("jane@x.com");
  });
  it("rejects short passwords", () => {
    expect(signupSchema.safeParse({ name: "Jane", email: "j@x.com", password: "short" }).success).toBe(
      false,
    );
  });
  it("rejects invalid email", () => {
    expect(
      signupSchema.safeParse({ name: "Jane", email: "not-an-email", password: "longenough" }).success,
    ).toBe(false);
  });
});

describe("contactSchema", () => {
  it("defaults lifecycle to LEAD", () => {
    const r = contactSchema.parse({ firstName: "A", lastName: "B", email: "a@b.com" });
    expect(r.lifecycleStage).toBe("LEAD");
  });
  it("coerces empty optional strings to undefined", () => {
    const r = contactSchema.parse({ firstName: "A", lastName: "B", email: "a@b.com", phone: "" });
    expect(r.phone).toBeUndefined();
  });
  it("rejects missing required fields", () => {
    expect(contactSchema.safeParse({ firstName: "", lastName: "B", email: "a@b.com" }).success).toBe(
      false,
    );
  });
});

describe("dealSchema", () => {
  it("coerces amount and parses close date", () => {
    const r = dealSchema.parse({ name: "Deal", amount: "5000", closeDate: "2025-01-01" });
    expect(r.amount).toBe(5000);
    expect(r.closeDate).toBeInstanceOf(Date);
  });
  it("rejects negative amounts", () => {
    expect(dealSchema.safeParse({ name: "Deal", amount: -1 }).success).toBe(false);
  });
});

describe("ticketSchema", () => {
  it("defaults status and priority", () => {
    const r = ticketSchema.parse({ subject: "Help" });
    expect(r.status).toBe("NEW");
    expect(r.priority).toBe("MEDIUM");
  });
});

describe("campaignSchema", () => {
  it("requires a segment", () => {
    expect(
      campaignSchema.safeParse({ name: "C", subject: "S", body: "B", segmentId: "" }).success,
    ).toBe(false);
  });
});

describe("formSchema", () => {
  it("requires at least one field", () => {
    expect(formSchema.safeParse({ name: "F", fields: [] }).success).toBe(false);
  });
  it("accepts a valid form", () => {
    const r = formSchema.parse({
      name: "Contact",
      fields: [{ id: "1", type: "email", label: "Email", required: true }],
    });
    expect(r.fields[0].mapsTo).toBe("none");
    expect(r.submitText).toBe("Submit");
  });
});

describe("segmentFilterSchema", () => {
  it("accepts empty filters", () => {
    expect(segmentFilterSchema.safeParse({}).success).toBe(true);
  });
});
