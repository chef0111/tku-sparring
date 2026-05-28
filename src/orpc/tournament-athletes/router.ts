import {
  bulkAddAthletes,
  bulkRemoveTournamentAthleteRecords,
  listTournamentAthletes,
  removeTournamentAthleteRecord,
  updateTournamentAthleteRecord,
} from './index';

export const tournamentAthleteRouter = {
  list: listTournamentAthletes,
  bulkAdd: bulkAddAthletes,
  update: updateTournamentAthleteRecord,
  remove: removeTournamentAthleteRecord,
  bulkRemove: bulkRemoveTournamentAthleteRecords,
} as const;
