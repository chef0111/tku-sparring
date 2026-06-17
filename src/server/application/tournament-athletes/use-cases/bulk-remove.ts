import type { BulkRemoveTournamentAthletesCommand } from './roster-commands';
import type { TournamentAthleteStore } from '../repositories/roster';

export async function bulkRemoveTournamentAthletes(
  command: BulkRemoveTournamentAthletesCommand,
  store: TournamentAthleteStore
) {
  return store.bulkRemove(command);
}
