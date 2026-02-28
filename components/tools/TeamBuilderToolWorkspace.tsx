"use client";

import { TeamBuilderWorkbench } from "@/components/tools/team-builder/TeamBuilderWorkbench";
import { type PokemonListEntry } from "@/types/pokemon";

interface TeamBuilderToolWorkspaceProps {
  candidatePokemon: PokemonListEntry[];
}

export function TeamBuilderToolWorkspace({
  candidatePokemon
}: TeamBuilderToolWorkspaceProps) {
  return <TeamBuilderWorkbench candidatePokemon={candidatePokemon} />;
}
