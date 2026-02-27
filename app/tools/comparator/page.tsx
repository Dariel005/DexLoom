import type { Metadata } from "next";
import { ComparatorToolWorkspace } from "@/components/tools/ComparatorToolWorkspace";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { ToolsRightRail } from "@/components/tools/ToolsRightRail";
import { loadToolCandidatePokemon } from "@/lib/tools-candidates";
import { getToolDefinition } from "@/lib/tools-directory";

const tool = getToolDefinition("comparator");

export const metadata: Metadata = {
  title: "Tools - Comparator",
  description:
    "A/B Pokemon comparator with role-based focus scoring and side-by-side stat intelligence."
};

export default async function ToolsComparatorPage() {
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
      frameTitle="Tools - Comparator"
      heroEyebrow="Dedicated Tool"
      heroTitle={tool.title}
      heroDescription={tool.description}
      heroChips={[
        { label: `${candidatePokemon.length} candidate options` },
        { label: "A/B role scoring", tone: "sky" },
        { label: "Direct selector sync", tone: "amber" }
      ]}
      schema={schema}
      leftContent={<ComparatorToolWorkspace candidatePokemon={candidatePokemon} />}
      rightContent={
        <ToolsRightRail
          guideTitle="Comparator Tactics"
          guideItems={[
            "Use General for broad ranking, then confirm with offense/defense/speed focus.",
            "Click either compared Pokemon name to sync the global selected target.",
            "Type row confirms whether raw stat winner also fits matchup profile."
          ]}
        />
      }
    />
  );
}

