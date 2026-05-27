import type {
  BulkAddAthletesDTO,
  ListTournamentAthletesDTO,
  UpdateTournamentAthleteDTO,
} from '@/orpc/tournament-athletes/dto';
import { client } from '@/orpc/client';

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
