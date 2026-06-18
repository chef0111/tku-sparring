import type { ListTournamentAthletesQuery } from './roster-commands';
import type { TournamentAthleteStore } from '../repositories/roster';

export async function listTournamentAthletes(
  query: ListTournamentAthletesQuery,
  store: TournamentAthleteStore
) {
  return store.list(query);
}
