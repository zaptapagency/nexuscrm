/**
 * Minimal, dependency-free CSV utilities used for contact import/export.
 * Handles quoted fields, embedded commas, escaped quotes, and CRLF/LF line endings.
 */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }
  }

  // Flush the final field/row if there is trailing content.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export interface ParsedContactRow {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  lifecycleStage?: string;
  company?: string;
}

const HEADER_ALIASES: Record<string, keyof ParsedContactRow> = {
  firstname: "firstName",
  "first name": "firstName",
  first: "firstName",
  lastname: "lastName",
  "last name": "lastName",
  last: "lastName",
  email: "email",
  "email address": "email",
  phone: "phone",
  "phone number": "phone",
  jobtitle: "jobTitle",
  "job title": "jobTitle",
  title: "jobTitle",
  lifecyclestage: "lifecycleStage",
  "lifecycle stage": "lifecycleStage",
  stage: "lifecycleStage",
  company: "company",
  "company name": "company",
  organization: "company",
}

export interface CsvImportResult {
  rows: ParsedContactRow[];
  errors: string[];
}

export function parseContactsCsv(text: string): CsvImportResult {
  const matrix = parseCsv(text);
  const errors: string[] = [];
  const rows: ParsedContactRow[] = [];

  if (matrix.length === 0) {
    return { rows, errors: ["The CSV file is empty."] };
  }

  const header = matrix[0].map((h) => h.trim().toLowerCase());
  const map: Partial<Record<keyof ParsedContactRow, number>> = {};
  header.forEach((h, idx) => {
    const key = HEADER_ALIASES[h];
    if (key) map[key] = idx;
  });

  if (map.email === undefined) {
    return { rows, errors: ["CSV must contain an 'email' column."] };
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (let i = 1; i < matrix.length; i++) {
    const cells = matrix[i];
    const get = (k: keyof ParsedContactRow) => {
      const idx = map[k];
      return idx === undefined ? "" : (cells[idx] ?? "").trim();
    };
    const email = get("email").toLowerCase();
    if (!email) {
      errors.push(`Row ${i + 1}: missing email — skipped.`);
      continue;
    }
    if (!emailRe.test(email)) {
      errors.push(`Row ${i + 1}: invalid email "${email}" — skipped.`);
      continue;
    }
    let firstName = get("firstName");
    let lastName = get("lastName");
    if (!firstName && !lastName) {
      firstName = email.split("@")[0];
      lastName = "";
    }
    rows.push({
      firstName: firstName || email.split("@")[0],
      lastName: lastName || "",
      email,
      phone: get("phone") || undefined,
      jobTitle: get("jobTitle") || undefined,
      lifecycleStage: get("lifecycleStage").toUpperCase() || undefined,
      company: get("company") || undefined,
    });
  }

  return { rows, errors };
}

function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }
  return lines.join("\n");
}
