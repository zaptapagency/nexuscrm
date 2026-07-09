import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getOwnerOptions, getCompanyOptions } from "@/lib/queries";
import { segmentFilterSchema, type SegmentFilters } from "@/lib/validations";
import { buildContactWhere, describeSegment } from "@/lib/segments";
import { PageHeader } from "@/components/page-header";
import { SegmentsClient } from "./segments-client";

export const metadata: Metadata = { title: "Segments" };

function parseFilters(raw: string): SegmentFilters {
  try {
    const parsed = segmentFilterSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export default async function SegmentsPage() {
  const [segments, owners, companies] = await Promise.all([
    prisma.segment.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { campaigns: true } } },
    }),
    getOwnerOptions(),
    getCompanyOptions(),
  ]);

  const rows = await Promise.all(
    segments.map(async (s) => {
      const filters = parseFilters(s.filters);
      const matchCount = await prisma.contact.count({ where: buildContactWhere(filters) });
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        filters,
        summary: describeSegment(filters),
        matchCount,
        campaignCount: s._count.campaigns,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Segments"
        description="Saved contact filters you can target with campaigns."
      />
      <SegmentsClient
        segments={rows}
        owners={owners.map((o) => ({ id: o.id, name: o.name }))}
        companies={companies}
      />
    </div>
  );
}
