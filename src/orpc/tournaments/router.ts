import {
  createTournament,
  ensureArenaSlot,
  getTournament,
  listTournaments,
  moveGroupArena,
  removeTournament,
  retireArena,
  setArenaGroupOrder,
  setTournamentStatus,
  updateTournament,
} from './index';

export const tournamentRouter = {
  list: listTournaments,
  get: getTournament,
  create: createTournament,
  update: updateTournament,
  setStatus: setTournamentStatus,
  setArenaGroupOrder,
  moveGroupArena,
  ensureArenaSlot,
  retireArena,
  delete: removeTournament,
} as const;
