import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Your workspace at a glance." />
      <p className="text-muted-foreground">Dashboard coming online…</p>
    </div>
  );
}
