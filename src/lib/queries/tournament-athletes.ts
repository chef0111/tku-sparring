import type { ListTournamentAthletesDTO } from '@/orpc/tournament-athletes/dto';

/**
 * Stable identity for `placeholderData`: same filters / scope, excluding
 * page, perPage, and sorting so paginating or re-sorting keeps prior rows visible.
 */
export function listAthleteListIdentityKey(
  input: ListTournamentAthletesDTO
): string {
  return JSON.stringify({
    tournamentId: input.tournamentId,
    groupId: input.groupId ?? null,
    unassignedOnly: input.unassignedOnly ?? false,
    query: input.query ?? '',
    gender: input.gender ?? null,
    beltLevels: input.beltLevels ?? null,
    beltLevelMin: input.beltLevelMin ?? null,
    beltLevelMax: input.beltLevelMax ?? null,
    weightMin: input.weightMin ?? null,
    weightMax: input.weightMax ?? null,
    status: input.status ?? null,
  });
}
