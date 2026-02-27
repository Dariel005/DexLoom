"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

const HIDDEN_PREFIXES = ["/login", "/register"];

export function WikiSiteFooter() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isHidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isHidden) {
    return null;
  }

  return (
    <footer role="contentinfo" aria-label="Site references and legal" className="mx-auto mt-4 w-full max-w-[2560px] px-2 pb-4 sm:px-4 lg:px-5">
      <section className="rounded-2xl border border-black/20 bg-white/55 p-4 dark:border-white/10 dark:bg-black/40">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          {t("footer.references")}
        </h2>
        <p className="mt-2 text-sm text-black/70">
          {t("footer.description")}{" "}
          <Link href="/sources" className="underline decoration-black/30 underline-offset-2">
            {t("footer.sourcesLink")}
          </Link>{" "}
          {t("footer.descriptionEnd")}
        </p>
        <p className="mt-2 text-xs text-black/55">
          {t("footer.legal")}
        </p>
      </section>
    </footer>
  );
}

