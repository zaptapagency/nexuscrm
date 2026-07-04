import { describe, it, expect } from "vitest";
import { parseCsv, parseContactsCsv, toCsv } from "./csv";

describe("parseCsv", () => {
  it("parses simple rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields with commas", () => {
    expect(parseCsv('name,note\n"Doe, Jane","hi, there"')).toEqual([
      ["name", "note"],
      ["Doe, Jane", "hi, there"],
    ]);
  });

  it("handles escaped quotes", () => {
    expect(parseCsv('q\n"say ""hi"""')).toEqual([["q"], ['say "hi"']]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("parseContactsCsv", () => {
  it("maps header aliases and validates emails", () => {
    const csv = "First Name,Last Name,Email,Company\nAva,Reyes,ava@acme.com,Acme";
    const { rows, errors } = parseContactsCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows[0]).toMatchObject({
      firstName: "Ava",
      lastName: "Reyes",
      email: "ava@acme.com",
      company: "Acme",
    });
  });

  it("errors when email column is missing", () => {
    const { errors } = parseContactsCsv("name,phone\nAva,123");
    expect(errors[0]).toMatch(/email/i);
  });

  it("skips rows with invalid emails and records an error", () => {
    const csv = "email\nnotanemail\nvalid@x.com";
    const { rows, errors } = parseContactsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("valid@x.com");
    expect(errors).toHaveLength(1);
  });

  it("derives a name from email when names are absent", () => {
    const { rows } = parseContactsCsv("email\njohn@x.com");
    expect(rows[0].firstName).toBe("john");
  });
});

describe("toCsv", () => {
  it("escapes cells containing commas and quotes", () => {
    const out = toCsv(["a", "b"], [["x,y", 'z"q']]);
    expect(out).toBe('a,b\n"x,y","z""q"');
  });
});
