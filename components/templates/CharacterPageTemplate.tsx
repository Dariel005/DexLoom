import Image from "next/image";
import { ReferencesBlock, type ReferenceEntry } from "@/components/wiki/ReferencesBlock";
import { WikiTagList } from "@/components/wiki/WikiTagList";

export interface CharacterPageTemplateData {
  name: string;
  role: string;
  regionLabel: string;
  portraitSrc: string;
  portraitAlt: string;
  overview: string;
  battleStyle: string;
  signaturePokemon: string[];
  quote: string;
  games: string[];
  teamsByGame: Array<{
    game: string;
    team: string;
  }>;
  tags: string[];
  references?: ReferenceEntry[];
}

const DEFAULT_CHARACTER_DATA: CharacterPageTemplateData = {
  name: "Unknown Character",
  role: "Character role pending",
  regionLabel: "Unknown region",
  portraitSrc: "/images/characters/official/red-frlg.png",
  portraitAlt: "Official character portrait",
  overview: "Profile summary pending.",
  battleStyle: "Battle style details pending.",
  signaturePokemon: ["Unknown"],
  quote: "Character quote pending.",
  games: ["Main appearance not set"],
  teamsByGame: [{ game: "Main title", team: "Team data pending." }],
  tags: ["character", "pending"]
};

interface CharacterPageTemplateProps {
  data?: Partial<CharacterPageTemplateData>;
}

function mergeCharacterData(
  data: Partial<CharacterPageTemplateData> | undefined
): CharacterPageTemplateData {
  return {
    ...DEFAULT_CHARACTER_DATA,
    ...data,
    signaturePokemon:
      data?.signaturePokemon ?? DEFAULT_CHARACTER_DATA.signaturePokemon,
    games: data?.games ?? DEFAULT_CHARACTER_DATA.games,
    teamsByGame: data?.teamsByGame ?? DEFAULT_CHARACTER_DATA.teamsByGame,
    tags: data?.tags ?? DEFAULT_CHARACTER_DATA.tags,
    references: data?.references ?? DEFAULT_CHARACTER_DATA.references
  };
}

export function CharacterPageTemplate({ data }: CharacterPageTemplateProps) {
  const entry = mergeCharacterData(data);
  const appearanceCount = entry.games.length;
  const teamSnapshotCount = entry.teamsByGame.length;
  const signatureCount = entry.signaturePokemon.length;

  return (
    <article className="character-page-template space-y-4">
      <section className="character-page-hero relative overflow-hidden rounded-2xl border border-black/20 bg-white/60 p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.55),transparent_40%),radial-gradient(circle_at_10%_90%,rgba(43,73,112,0.14),transparent_45%)]" />
        <div className="character-page-hero-grid relative grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="space-y-2">
            <div className="character-page-portrait relative aspect-[3/4] overflow-hidden rounded-[1.1rem] border border-black/20 bg-[linear-gradient(165deg,rgba(255,255,255,0.45),rgba(155,188,221,0.3))] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_14px_26px_rgba(0,0,0,0.14)]">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.06)_1px,transparent_1px,transparent_7px)]" />
              <Image
                src={entry.portraitSrc}
                alt={entry.portraitAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 260px"
                className="object-contain object-bottom p-2"
                priority
              />
            </div>
            <div className="rounded-xl border border-black/15 bg-white/70 px-3 py-2 text-xs text-black/70">
              <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
                Region
              </p>
              <p className="mt-0.5 font-medium text-black/80">{entry.regionLabel}</p>
            </div>
          </div>

          <div className="character-page-summary space-y-3">
            <div>
              <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/65">
                Character Dossier
              </p>
              <h1 className="pixel-font mt-1 text-[18px] uppercase tracking-[0.12em] text-black/85 sm:text-[22px]">
                {entry.name}
              </h1>
              <p className="mt-1 rounded-lg border border-black/15 bg-white/70 px-3 py-2 text-sm text-black/75">
                {entry.role}
              </p>
            </div>

            <div className="character-page-metrics grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-black/15 bg-white/70 px-3 py-2">
                <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/65">
                  Appearances
                </p>
                <p className="mt-0.5 text-sm font-semibold text-black/80">{appearanceCount}</p>
              </div>
              <div className="rounded-lg border border-black/15 bg-white/70 px-3 py-2">
                <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/65">
                  Teams
                </p>
                <p className="mt-0.5 text-sm font-semibold text-black/80">{teamSnapshotCount}</p>
              </div>
              <div className="rounded-lg border border-black/15 bg-white/70 px-3 py-2">
                <p className="pixel-font text-[10px] uppercase tracking-[0.14em] text-black/65">
                  Signature
                </p>
                <p className="mt-0.5 text-sm font-semibold text-black/80">{signatureCount}</p>
              </div>
            </div>

            <p className="rounded-lg border border-black/15 bg-white/70 px-3 py-2 text-sm leading-relaxed text-black/75">
              {entry.overview}
            </p>

            <div className="character-page-quote rounded-xl border border-black/20 bg-gradient-to-r from-black/[0.05] via-white/70 to-black/[0.05] px-3 py-3">
              <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
                Quote
              </p>
              <p className="mt-1 text-sm italic text-black/80">&quot;{entry.quote}&quot;</p>
            </div>

            <div className="character-page-signature rounded-lg border border-black/15 bg-white/70 px-3 py-2">
              <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/70">
                Signature Pokemon
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {entry.signaturePokemon.map((name) => (
                  <span
                    key={name}
                    className="rounded-md border border-black/20 bg-white/85 px-2 py-1 text-xs font-medium text-black/75"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <WikiTagList tags={entry.tags} />
            </div>
          </div>
        </div>
      </section>

      <section className="character-page-dual grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="character-page-appearances rounded-2xl border border-black/20 bg-white/60 p-4">
          <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
            Major Appearances
          </h2>
          <div className="mt-2 space-y-2 text-sm">
            {entry.games.map((game) => (
              <p key={game} className="rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-black/75">
                {game}
              </p>
            ))}
          </div>
        </div>
        <div className="character-page-battle rounded-2xl border border-black/20 bg-white/60 p-4">
          <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
            Battle Style
          </h2>
          <p className="mt-2 rounded-lg border border-black/20 bg-white/70 px-3 py-2 text-sm leading-relaxed text-black/75">
            {entry.battleStyle}
          </p>
        </div>
      </section>

      <section className="character-page-teams rounded-2xl border border-black/20 bg-white/60 p-4">
        <h2 className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/75">
          Teams By Game
        </h2>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {entry.teamsByGame.map((teamEntry) => (
            <div
              key={teamEntry.game}
              className="rounded-xl border border-black/20 bg-white/70 px-3 py-2"
            >
              <p className="pixel-font text-[10px] uppercase tracking-[0.12em] text-black/75">
                {teamEntry.game}
              </p>
              <p className="mt-1 text-black/70">{teamEntry.team}</p>
            </div>
          ))}
        </div>
      </section>

      <ReferencesBlock references={entry.references} />
    </article>
  );
}
