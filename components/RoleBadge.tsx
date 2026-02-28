import { ROLE_LABELS, type UserRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role?: UserRole;
  label?: string | null;
  className?: string;
  compact?: boolean;
}

export function RoleBadge({
  role = "member",
  label,
  className,
  compact = false
}: RoleBadgeProps) {
  const resolvedLabel = label ?? ROLE_LABELS[role];

  if (!resolvedLabel) {
    return null;
  }

  return (
    <span
      className={cn("role-badge", compact && "role-badge--compact", className)}
      data-role={role}
      aria-label={`Role ${resolvedLabel}`}
    >
      {resolvedLabel}
    </span>
  );
}
