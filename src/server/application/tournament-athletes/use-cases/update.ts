import type { UpdateTournamentAthleteCommand } from './roster-commands';
import type { TournamentAthleteStore } from '../repositories/roster';

export async function updateTournamentAthlete(
  command: UpdateTournamentAthleteCommand,
  store: TournamentAthleteStore
) {
  return store.update(command);
}
