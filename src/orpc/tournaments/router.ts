import {
  createTournament,
  ensureArenaSlot,
  getTournament,
  listTournaments,
  moveDivisionArena,
  removeTournament,
  retireArena,
  setArenaDivisionOrder,
  setTournamentStatus,
  updateTournament,
} from './index';

export const tournamentRouter = {
  list: listTournaments,
  get: getTournament,
  create: createTournament,
  update: updateTournament,
  setStatus: setTournamentStatus,
  setArenaDivisionOrder,
  moveDivisionArena,
  ensureArenaSlot,
  retireArena,
  delete: removeTournament,
} as const;
