import type { Metadata } from "next";
import { MovePlannerToolWorkspace } from "@/components/tools/MovePlannerToolWorkspace";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { ToolsRightRail } from "@/components/tools/ToolsRightRail";
import { loadToolCandidatePokemon } from "@/lib/tools-candidates";
import { getToolDefinition } from "@/lib/tools-directory";

const tool = getToolDefinition("move-planner");

export const metadata: Metadata = {
  title: "Tools - Move Planner",
  description:
    "Move Planner desk with learn-method filtering, quick plan suggestions, and move table intelligence."
};

export default async function ToolsMovePlannerPage() {
  const candidatePokemon = await loadToolCandidatePokemon();
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: tool.title,
    description: tool.description,
    url: `https://pokedex-wiki-pro.vercel.app${tool.href}`
  };

  return (
    <ToolsPageShell
      frameTitle="Tools - Move Planner"
      heroEyebrow="Dedicated Tool"
      heroTitle={tool.title}
      heroDescription={tool.description}
      heroChips={[
        { label: `${candidatePokemon.length} candidate options` },
        { label: "Method routing", tone: "violet" },
        { label: "Quick plan presets", tone: "sky" }
      ]}
      schema={schema}
      leftContent={<MovePlannerToolWorkspace candidatePokemon={candidatePokemon} />}
      rightContent={
        <ToolsRightRail
          guideTitle="Move Planner Tactics"
          guideItems={[
            "Start with method filter to isolate realistic acquisition routes.",
            "Use Quick Learning Plan to seed high-value move search instantly.",
            "Track result count versus total moves to avoid over-filtering."
          ]}
        />
      }
    />
  );
}

