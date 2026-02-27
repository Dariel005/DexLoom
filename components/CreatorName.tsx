import { cn } from "@/lib/utils";

interface CreatorNameProps {
  name: string;
  isCreator?: boolean;
  className?: string;
  badgeClassName?: string;
  compact?: boolean;
  showBadge?: boolean;
}

export function CreatorName({
  name,
  isCreator = false,
  className,
  badgeClassName,
  compact = false,
  showBadge = true
}: CreatorNameProps) {
  if (!isCreator) {
    return <span className={className}>{name}</span>;
  }

  return (
    <span className={cn("creator-name-shell", compact && "creator-name-shell-compact", className)}>
      <span className={cn("creator-name-text", compact && "creator-name-text-compact")}>{name}</span>
      {showBadge ? (
        <span className={cn("creator-name-badge", compact && "creator-name-badge-compact", badgeClassName)}>
          Creator
        </span>
      ) : null}
    </span>
  );
}

