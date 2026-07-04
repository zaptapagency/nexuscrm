import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingHome() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">NexusCRM</h1>
      <Button asChild>
        <Link href="/login">Log in</Link>
      </Button>
    </div>
  );
}
