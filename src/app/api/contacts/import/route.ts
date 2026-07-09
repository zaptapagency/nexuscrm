import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { parseContactsCsv } from "@/lib/csv";
import { logActivity } from "@/lib/activity";
import { LIFECYCLE_STAGES } from "@/lib/constants";

export const POST = withAuth(async (user, req) => {
  const { text } = await req.json();
  if (typeof text !== "string" || !text.trim()) {
    return ok({ error: "No CSV content provided." }, 400);
  }

  const { rows, errors } = parseContactsCsv(text);
  let created = 0;
  let updated = 0;

  // Cache company lookups by name to avoid N+1 within the loop.
  const companyCache = new Map<string, string>();
  async function resolveCompany(name?: string): Promise<string | undefined> {
    if (!name) return undefined;
    const key = name.toLowerCase();
    if (companyCache.has(key)) return companyCache.get(key);
    let company = await prisma.company.findFirst({ where: { name } });
    if (!company) {
      company = await prisma.company.create({ data: { name, ownerId: user.id } });
    }
    companyCache.set(key, company.id);
    return company.id;
  }

  for (const row of rows) {
    const companyId = await resolveCompany(row.company);
    const lifecycleStage =
      row.lifecycleStage && (LIFECYCLE_STAGES as readonly string[]).includes(row.lifecycleStage)
        ? row.lifecycleStage
        : "LEAD";
    const existing = await prisma.contact.findUnique({ where: { email: row.email } });
    if (existing) {
      await prisma.contact.update({
        where: { id: existing.id },
        data: {
          firstName: row.firstName || existing.firstName,
          lastName: row.lastName || existing.lastName,
          phone: row.phone ?? existing.phone,
          jobTitle: row.jobTitle ?? existing.jobTitle,
          companyId: companyId ?? existing.companyId,
        },
      });
      updated++;
    } else {
      const contact = await prisma.contact.create({
        data: {
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          jobTitle: row.jobTitle,
          lifecycleStage,
          companyId,
          ownerId: user.id,
          source: "Import",
        },
      });
      await logActivity({
        type: "CREATED",
        message: `Contact imported from CSV`,
        actorId: user.id,
        contactId: contact.id,
      });
      created++;
    }
  }

  return ok({ created, updated, skipped: errors.length, errors });
}, "record:create");
