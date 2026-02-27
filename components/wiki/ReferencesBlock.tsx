import Link from "next/link";

export interface ReferenceEntry {
  label: string;
  href?: string;
  note?: string;
}

interface ReferencesBlockProps {
  title?: string;
  references?: ReferenceEntry[];
  emptyLabel?: string;
}

export function ReferencesBlock({
  title = "References",
  references = [],
  emptyLabel = "No references added yet."
}: ReferencesBlockProps) {
  return (
    <section className="rounded-2xl border border-black/20 bg-white/60 p-4">
      <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
        {title}
      </h2>
      {references.length === 0 ? (
        <p className="mt-2 text-sm text-black/65">{emptyLabel}</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm text-black/75">
          {references.map((reference) => (
            <li key={`${reference.label}-${reference.href ?? "plain"}`}>
              {reference.href ? (
                <Link
                  href={reference.href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-black/30 underline-offset-2 hover:decoration-black/60"
                >
                  {reference.label}
                </Link>
              ) : (
                <span>{reference.label}</span>
              )}
              {reference.note ? (
                <span className="text-black/55"> - {reference.note}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

