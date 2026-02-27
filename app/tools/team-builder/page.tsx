import type { Metadata } from "next";
import { TeamBuilderToolWorkspace } from "@/components/tools/TeamBuilderToolWorkspace";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { ToolsRightRail } from "@/components/tools/ToolsRightRail";
import { loadToolCandidatePokemon } from "@/lib/tools-candidates";
import { getToolDefinition } from "@/lib/tools-directory";

const tool = getToolDefinition("team-builder");

export const metadata: Metadata = {
  title: "Tools - Team Builder",
  description:
    "Team Builder matrix with synergy scoring, defensive risk alerts, and repeated type diagnostics."
};

export default async function ToolsTeamBuilderPage() {
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
      frameTitle="Tools - Team Builder"
      heroEyebrow="Dedicated Tool"
      heroTitle={tool.title}
      heroDescription={tool.description}
      heroChips={[
        { label: "6-slot builder" },
        { label: "Coverage diagnostics", tone: "amber" },
        { label: "Synergy score", tone: "green" }
      ]}
      schema={schema}
      leftContent={<TeamBuilderToolWorkspace candidatePokemon={candidatePokemon} />}
      rightContent={
        <ToolsRightRail
          guideTitle="Team Builder Tactics"
          guideItems={[
            "Use Add selected to quickly transfer current focus Pokemon into your draft.",
            "Watch Main Defensive Risks first; reduce severe weak stacks before finalizing.",
            "Repeated Team Types helps detect hidden redundancy across offensive plans."
          ]}
        />
      }
    />
  );
}

