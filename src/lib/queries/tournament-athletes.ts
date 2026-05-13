import type { ListTournamentAthletesDTO } from '@/orpc/tournament-athletes/tournament-athletes.dto';

export function listAthletePlaceholderKey(
  input: ListTournamentAthletesDTO
): string {
  return JSON.stringify({
    tournamentId: input.tournamentId,
    groupId: input.groupId ?? null,
    unassignedOnly: input.unassignedOnly ?? false,
    page: input.page ?? 1,
    perPage: input.perPage ?? 30,
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
