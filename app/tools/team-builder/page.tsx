import type { Metadata } from "next";
import { TeamBuilderToolWorkspace } from "@/components/tools/TeamBuilderToolWorkspace";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { loadToolCandidatePokemon } from "@/lib/tools-candidates";
import { getToolDefinition } from "@/lib/tools-directory";

const tool = getToolDefinition("team-builder");

export const metadata: Metadata = {
  title: "Tools - Team Builder",
  description:
    "Interactive Pokemon team builder with Bill's PC storage, drag and drop slots, live synergy reads, and detailed stat editing."
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
      heroDescription="Build a six-slot party with Bill's PC drag-and-drop controls, save up to ten teams, tune stats, and scan global defensive synergy in real time."
      heroChips={[
        { label: "Bill's PC UI" },
        { label: "10 saved teams", tone: "amber" },
        { label: "EV / IV radar", tone: "sky" },
        { label: "Type synergy scan", tone: "green" }
      ]}
      schema={schema}
      leftContent={<TeamBuilderToolWorkspace candidatePokemon={candidatePokemon} />}
      rightContent={null}
    />
  );
}
