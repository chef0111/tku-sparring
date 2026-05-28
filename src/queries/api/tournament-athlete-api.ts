import type {
  BulkAddAthletesDTO,
  BulkRemoveTournamentAthletesDTO,
  ListTournamentAthletesDTO,
  UpdateTournamentAthleteDTO,
} from '@/orpc/tournament-athletes/dto';
import { client } from '@/orpc/client';

/**
 * Stable identity for `placeholderData`: same filters / scope, excluding
 * page, perPage, and sorting so paginating or re-sorting keeps prior rows visible.
 */
export function getAthleteIdentityKey(
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

export function listTournamentAthletes(input: ListTournamentAthletesDTO) {
  return client.tournamentAthlete.list(input);
}

export function bulkAddTournamentAthletes(data: BulkAddAthletesDTO) {
  return client.tournamentAthlete.bulkAdd(data);
}

export function updateTournamentAthlete(data: UpdateTournamentAthleteDTO) {
  return client.tournamentAthlete.update(data);
}

export function removeTournamentAthlete(data: { id: string }) {
  return client.tournamentAthlete.remove(data);
}

export function bulkRemoveTournamentAthletes(
  data: BulkRemoveTournamentAthletesDTO
) {
  return client.tournamentAthlete.bulkRemove(data);
}
