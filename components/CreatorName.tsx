import { RoleDisplayName } from "@/components/RoleDisplayName";
import type { UserRole } from "@/lib/roles";

interface CreatorNameProps {
  name: string;
  isCreator?: boolean;
  role?: UserRole;
  className?: string;
  badgeClassName?: string;
  compact?: boolean;
  showBadge?: boolean;
}

export function CreatorName({
  name,
  isCreator = false,
  role,
  className,
  badgeClassName,
  compact = false,
  showBadge = true
}: CreatorNameProps) {
  const resolvedRole = role ?? (isCreator ? "creator" : "member");

  return (
    <RoleDisplayName
      name={name}
      role={resolvedRole}
      className={className}
      badgeClassName={badgeClassName}
      compact={compact}
      showBadge={showBadge}
    />
  );
}
