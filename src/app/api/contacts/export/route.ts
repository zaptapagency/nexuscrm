import { prisma } from "@/lib/prisma";
import { getAuthedUser } from "@/lib/api";
import { toCsv } from "@/lib/csv";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    include: { company: { select: { name: true } }, owner: { select: { name: true } } },
  });

  const csv = toCsv(
    ["First Name", "Last Name", "Email", "Phone", "Job Title", "Lifecycle Stage", "Company", "Owner"],
    contacts.map((c) => [
      c.firstName,
      c.lastName,
      c.email,
      c.phone ?? "",
      c.jobTitle ?? "",
      c.lifecycleStage,
      c.company?.name ?? "",
      c.owner?.name ?? "",
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
