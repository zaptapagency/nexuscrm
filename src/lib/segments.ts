import type { Prisma } from "@prisma/client";
import type { SegmentFilters } from "./validations";

/**
 * Builds a Prisma `where` clause for Contacts from a saved segment's filter object.
 * Pure function — unit tested independently of the database.
 */
export function buildContactWhere(filters: SegmentFilters): Prisma.ContactWhereInput {
  const where: Prisma.ContactWhereInput = {};

  if (filters.lifecycleStage) {
    where.lifecycleStage = filters.lifecycleStage;
  }
  if (filters.ownerId) {
    where.ownerId = filters.ownerId;
  }
  if (filters.companyId) {
    where.companyId = filters.companyId;
  }

  const createdAt: Prisma.DateTimeFilter = {};
  if (filters.createdAfter) {
    createdAt.gte = new Date(filters.createdAfter);
  }
  if (filters.createdBefore) {
    createdAt.lte = new Date(filters.createdBefore);
  }
  if (createdAt.gte || createdAt.lte) {
    where.createdAt = createdAt;
  }

  return where;
}

export function describeSegment(filters: SegmentFilters): string {
  const parts: string[] = [];
  if (filters.lifecycleStage) parts.push(`stage = ${filters.lifecycleStage}`);
  if (filters.ownerId) parts.push("owned by selected rep");
  if (filters.companyId) parts.push("at selected company");
  if (filters.createdAfter) parts.push(`created after ${filters.createdAfter}`);
  if (filters.createdBefore) parts.push(`created before ${filters.createdBefore}`);
  return parts.length ? parts.join(", ") : "All contacts";
}
