import { cn } from "@/lib/utils";
import { Hexagon } from "lucide-react";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center justify-center rounded-lg brand-gradient p-1.5 text-white", className)}>
      <Hexagon className="h-5 w-5" fill="currentColor" strokeWidth={1.5} />
    </span>
  );
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold", className)}>
      <BrandMark />
      <span className="text-lg tracking-tight">
        Nexus<span className="brand-text-gradient">CRM</span>
      </span>
    </span>
  );
}
