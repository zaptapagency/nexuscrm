import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  color,
  className,
}: {
  name: string;
  color?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarFallback style={{ backgroundColor: color ?? "#6366f1" }}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
