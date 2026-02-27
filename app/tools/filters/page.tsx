import type { Metadata } from "next";
import { FiltersToolWorkspace } from "@/components/tools/FiltersToolWorkspace";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { ToolsRightRail } from "@/components/tools/ToolsRightRail";
import { getToolDefinition } from "@/lib/tools-directory";

const tool = getToolDefinition("filters");

export const metadata: Metadata = {
  title: "Tools - Filters",
  description:
    "Global filters console for query, Dex ID, type, generation, and attack floor."
};

export default function ToolsFiltersPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: tool.title,
    description: tool.description,
    url: `https://pokedex-wiki-pro.vercel.app${tool.href}`
  };

  return (
    <ToolsPageShell
      frameTitle="Tools - Filters"
      heroEyebrow="Dedicated Tool"
      heroTitle={tool.title}
      heroDescription={tool.description}
      heroChips={[
        { label: "Global state tool" },
        { label: "Cross-tool impact", tone: "amber" },
        { label: "Fast constraint setup", tone: "green" }
      ]}
      schema={schema}
      leftContent={<FiltersToolWorkspace />}
      rightContent={
        <ToolsRightRail
          guideTitle="Filters Tactics"
          guideItems={[
            "Set high-impact constraints first: generation and type filters.",
            "Use Dex ID for narrow pinpoint selection when testing edge cases.",
            "Attack floor helps isolate offensive candidates before comparator runs."
          ]}
        />
      }
    />
  );
}

