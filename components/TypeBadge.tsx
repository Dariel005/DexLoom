import { memo } from "react";
import { cn, formatLabel } from "@/lib/utils";

const TYPE_STYLES: Record<string, string> = {
  normal: "from-[#A8A77A] to-[#8A8A59]",
  fire: "from-[#FF7F38] to-[#EE5A0D]",
  water: "from-[#4A9CF7] to-[#1F6BD6]",
  electric: "from-[#F8D64E] to-[#D6B10D]",
  grass: "from-[#77CD5B] to-[#49A443]",
  ice: "from-[#96D9D6] to-[#5BBFB8]",
  fighting: "from-[#C64A3A] to-[#972A1B]",
  poison: "from-[#A24ECF] to-[#7938A3]",
  ground: "from-[#E2C86D] to-[#C69F2C]",
  flying: "from-[#A98FF3] to-[#7F6FD2]",
  psychic: "from-[#FF5C95] to-[#D43871]",
  bug: "from-[#A6B91A] to-[#7C8D0A]",
  rock: "from-[#B6A136] to-[#8E7820]",
  ghost: "from-[#735797] to-[#513878]",
  dragon: "from-[#6F47FF] to-[#4F2ED0]",
  dark: "from-[#705746] to-[#4A372A]",
  steel: "from-[#B7B7CE] to-[#8888A0]",
  fairy: "from-[#F4B2DF] to-[#DC89C0]",
  pokemon: "from-[#E23D4A] to-[#A31621]",
  trainer: "from-[#5EA7F5] to-[#235CBF]",
  energy: "from-[#F7D94A] to-[#D0A10F]",
  "game-boy": "from-[#C09B2D] to-[#8E6D1A]",
  "game-boy-color": "from-[#32B6E8] to-[#2F6FE7]",
  "game-boy-advance": "from-[#8B5CF6] to-[#5B35C9]",
  "nintendo-ds": "from-[#596074] to-[#2E3342]",
  "nintendo-3ds": "from-[#F14C62] to-[#BE1D2F]",
  "nintendo-switch": "from-[#E23D4A] to-[#A31621]",
  "nintendo-switch-2": "from-[#3563F3] to-[#232DA8]",
  "ios-android": "from-[#19B86D] to-[#127D51]",
  "switch-ios-android": "from-[#EA4335] via-[#27AE60] to-[#3B82F6]",
  mobile: "from-[#1FAF7A] to-[#0E7C57]"
};

interface TypeBadgeProps {
  type: string;
  label?: string;
  className?: string;
}

export const TypeBadge = memo(function TypeBadge({ type, label, className }: TypeBadgeProps) {
  const normalizedType = type.toLowerCase();
  const gradient = TYPE_STYLES[normalizedType] ?? "from-zinc-500 to-zinc-700";

  return (
    <span
      className={cn(
        "pixel-font inline-flex h-7 items-center justify-center whitespace-nowrap px-3 text-[9px] uppercase tracking-wide text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)]",
        "bg-gradient-to-br",
        gradient,
        className
      )}
      style={{
        clipPath: "polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%)"
      }}
    >
      {label ?? formatLabel(type)}
    </span>
  );
});
