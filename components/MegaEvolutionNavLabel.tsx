import Image from "next/image";
import { cn } from "@/lib/utils";

interface MegaEvolutionNavLabelProps {
  className?: string;
}

export function MegaEvolutionNavLabel({ className }: MegaEvolutionNavLabelProps) {
  return (
    <>
      <span className="mega-nav-bg" aria-hidden>
        <span className="mega-nav-bg-beam mega-nav-bg-beam-a" />
        <span className="mega-nav-bg-beam mega-nav-bg-beam-b" />
        <span className="mega-nav-bg-particle mega-nav-bg-particle-a" />
        <span className="mega-nav-bg-particle mega-nav-bg-particle-b" />
        <span className="mega-nav-bg-particle mega-nav-bg-particle-c" />
        <span className="mega-nav-bg-particle mega-nav-bg-particle-d" />
        <span className="mega-nav-bg-particle mega-nav-bg-particle-e" />
        <span className="mega-nav-bg-particle mega-nav-bg-particle-f" />
        <span className="mega-nav-bg-particle mega-nav-bg-particle-g" />
        <span className="mega-nav-bg-particle mega-nav-bg-particle-h" />
      </span>
      <span className={cn("mega-nav-label", className)}>
      <span className="mega-nav-icon" aria-hidden>
        <Image
          src="https://archives.bulbagarden.net/media/upload/e/ed/Mega_Evolution_symbol.png"
          alt=""
          width={20}
          height={26}
          className="mega-nav-icon-symbol"
        />
        <span className="mega-nav-ring mega-nav-ring-outer" />
        <span className="mega-nav-ring mega-nav-ring-inner" />
        <span className="mega-nav-particle mega-nav-particle-a" />
        <span className="mega-nav-particle mega-nav-particle-b" />
        <span className="mega-nav-particle mega-nav-particle-c" />
        <span className="mega-nav-particle mega-nav-particle-d" />
        <span className="mega-nav-particle mega-nav-particle-e" />
        <span className="mega-nav-particle mega-nav-particle-f" />
      </span>
      <span className="relative z-[1]">Mega Evolutions</span>
      </span>
    </>
  );
}
