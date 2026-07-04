import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, name: true, email: true, role: true, avatarColor: true, theme: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile and account security." />
      <SettingsClient user={user!} />
    </div>
  );
}
