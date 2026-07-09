import { prisma } from "./prisma";

/** Reusable option lists for select inputs across the app. */
export async function getOwnerOptions() {
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, avatarColor: true },
  });
  return users;
}

export async function getCompanyOptions() {
  return prisma.company.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getContactOptions() {
  const contacts = await prisma.contact.findMany({
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  return contacts.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    email: c.email,
  }));
}

export async function getSegmentOptions() {
  return prisma.segment.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getDealOptions() {
  return prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
}
