import type { RemoveTournamentAthleteCommand } from './roster-commands';
import type { TournamentAthleteStore } from '../repositories/roster';

export async function removeTournamentAthlete(
  command: RemoveTournamentAthleteCommand,
  store: TournamentAthleteStore
) {
  return store.remove(command);
}
