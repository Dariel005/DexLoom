import type { Metadata } from "next";
import { SectionModuleNav } from "@/components/SectionModuleNav";
import { ToolsHubPreviewBoard } from "@/components/tools/ToolsHubPreviewBoard";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { ToolsRightRail } from "@/components/tools/ToolsRightRail";
import { loadToolCandidatePokemon } from "@/lib/tools-candidates";
import { TOOL_DEFINITIONS } from "@/lib/tools-directory";

export const metadata: Metadata = {
  title: "Tools Hub",
  description:
    "Premium tools command hub with dedicated workstations for filters, comparator, team builder, move planner, and audio."
};

export default async function ToolsPage() {
  const candidatePokemon = await loadToolCandidatePokemon();

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "DexLoom Tools Hub",
    description:
      "Premium tools command hub with dedicated workstations for filters, comparator, team builder, move planner, and audio.",
    hasPart: TOOL_DEFINITIONS.map((tool) => ({
      "@type": "WebPage",
      name: tool.title,
      url: `https://pokedex-wiki-pro.vercel.app${tool.href}`
    }))
  };

  return (
    <ToolsPageShell
      frameTitle="Pokemon Tools"
      heroEyebrow="Tools Command Deck"
      heroTitle="Premium Tools Mission Control"
      heroDescription="Central launch hub for all advanced operational tools. Jump into each dedicated workstation and keep session context across tools."
      heroChips={[
        { label: `${TOOL_DEFINITIONS.length} dedicated tools` },
        { label: `${candidatePokemon.length} indexed Pokemon options`, tone: "green" },
        { label: "Live session previews", tone: "sky" }
      ]}
      schema={schema}
      leftContent={
        <>
          <ToolsHubPreviewBoard candidateCount={candidatePokemon.length} />
          <SectionModuleNav />
        </>
      }
      rightContent={
        <ToolsRightRail
          guideTitle="Hub Protocol"
          guideItems={[
            "Use the hub board to inspect live session state before switching tools.",
            "Each tool now has a dedicated page with full workspace depth.",
            "Comparator, Team Builder, and Move Planner share the same session memory.",
            "Filters remain global and affect downstream tool decisions."
          ]}
          footerNote="Tools state is preserved in session memory while you navigate between tool pages."
        />
      }
    />
  );
}

