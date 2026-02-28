"use client";

import { RoleBadge } from "@/components/RoleBadge";
import { ROLE_BADGE_LABELS, type UserRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface RoleDisplayNameProps {
  name: string;
  role?: UserRole;
  className?: string;
  badgeClassName?: string;
  compact?: boolean;
  showBadge?: boolean;
}

export function RoleDisplayName({
  name,
  role = "member",
  className,
  badgeClassName,
  compact = false,
  showBadge = true
}: RoleDisplayNameProps) {
  const badgeLabel = showBadge ? ROLE_BADGE_LABELS[role] : null;

  if (role === "member") {
    return (
      <span className={cn("role-name", className)} data-role={role}>
        {name}
      </span>
    );
  }

  return (
    <span
      className={cn("role-display", compact && "role-display--compact", className)}
      data-role={role}
    >
      <span
        className={cn("role-name", compact && "role-name--compact")}
        data-role={role}
        data-text={name}
      >
        {name}
      </span>

      {badgeLabel ? (
        <RoleBadge
          role={role}
          label={badgeLabel}
          compact={compact}
          className={badgeClassName}
        />
      ) : null}
    </span>
  );
}
