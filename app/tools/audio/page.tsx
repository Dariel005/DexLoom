import type { Metadata } from "next";
import { SoundControlPanel } from "@/components/SoundControlPanel";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { ToolsRightRail } from "@/components/tools/ToolsRightRail";
import { getToolDefinition } from "@/lib/tools-directory";

const tool = getToolDefinition("audio");

export const metadata: Metadata = {
  title: "Tools - Audio",
  description:
    "Audio Deck for controlling interface sound feedback and volume directly from the tools workspace."
};

export default function ToolsAudioPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: tool.title,
    description: tool.description,
    url: `https://pokedex-wiki-pro.vercel.app${tool.href}`
  };

  return (
    <ToolsPageShell
      frameTitle="Tools - Audio"
      heroEyebrow="Dedicated Tool"
      heroTitle={tool.title}
      heroDescription={tool.description}
      heroChips={[
        { label: "Session control" },
        { label: "Instant mute/toggle", tone: "amber" },
        { label: "Fine volume tuning", tone: "rose" }
      ]}
      schema={schema}
      leftContent={
        <section className="rounded-2xl border border-black/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(227,237,232,0.72))] p-4">
          <p className="pixel-font text-[10px] uppercase tracking-[0.16em] text-black/72">
            Audio Deck
          </p>
          <p className="mt-2 text-sm text-black/75">
            Control interface feedback volume and enable or disable sound output for the current session.
          </p>
          <div className="mt-3 max-w-[520px]">
            <SoundControlPanel
              className="border border-black/20 bg-white/60 shadow-none"
              defaultExpanded
            />
          </div>
        </section>
      }
      rightContent={
        <ToolsRightRail
          guideTitle="Audio Tactics"
          guideItems={[
            "Keep low volume for long sessions and reduce cognitive fatigue.",
            "Disable sound instantly for distraction-free comparison or team drafting.",
            "Use consistent volume while testing tool flows for accurate UX feedback."
          ]}
        />
      }
    />
  );
}

