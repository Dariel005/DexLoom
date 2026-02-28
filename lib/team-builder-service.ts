import {
  createEmptyPersistedTeamBuilderState,
  normalizePersistedTeamBuilderState,
  type PersistedTeamBuilderState
} from "@/lib/team-builder";
import {
  getTeamBuilderRecord,
  upsertTeamBuilderRecord
} from "@/lib/team-builder-repository";

export async function getUserTeamBuilderState(userId: string) {
  const record = await getTeamBuilderRecord(userId);
  return record?.state ?? createEmptyPersistedTeamBuilderState();
}

export async function saveUserTeamBuilderState(
  userId: string,
  input: PersistedTeamBuilderState
) {
  const state = normalizePersistedTeamBuilderState(input);
  const record = await upsertTeamBuilderRecord({
    userId,
    state,
    updatedAt: new Date().toISOString()
  });

  return record.state;
}
