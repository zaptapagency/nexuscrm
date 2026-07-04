import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { TeamClient } from "./team-client";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const session = await getSession();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      avatarColor: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team management"
        description="Invite teammates, assign roles, and control access."
      />
      <TeamClient
        initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
