import {
  findTournamentById,
  findTournamentWithLifecycle,
} from './read-lifecycle';
import { listTournaments } from './read-list';
import type { TournamentReadStore } from '@/server/application/tournaments/repositories/read';

export const tournamentReadStore: TournamentReadStore = {
  findWithLifecycle(id) {
    return findTournamentWithLifecycle(id);
  },
  findById(id) {
    return findTournamentById(id);
  },
  list(query) {
    return listTournaments(query);
  },
};

export {
  findTournamentById,
  findTournamentWithLifecycle,
} from './read-lifecycle';
