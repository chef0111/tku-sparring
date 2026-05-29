import {
  createTournament,
  deleteTournament,
  findTournamentById,
  setTournamentStatus,
  updateTournament,
} from './tournament-lifecycle';
import { listTournaments } from './tournament-list';
import {
  ensureArenaSlot,
  moveGroupBetweenArenas,
  retireArena,
  setArenaGroupOrder,
} from './tournament-arena-order';
import type {
  CreateTournamentDTO,
  EnsureArenaSlotDTO,
  ListTournamentsDTO,
  MoveGroupArenaDTO,
  RetireArenaDTO,
  SetArenaGroupOrderDTO,
  SetTournamentStatusDTO,
  UpdateTournamentDTO,
} from './dto';

export class TournamentDAL {
  static findMany(input: ListTournamentsDTO) {
    return listTournaments(input);
  }

  static findById(id: string) {
    return findTournamentById(id);
  }

  static create(data: CreateTournamentDTO) {
    return createTournament(data);
  }

  static update(id: string, data: Omit<UpdateTournamentDTO, 'id'>) {
    return updateTournament(id, data);
  }

  static setStatus(input: SetTournamentStatusDTO & { adminId: string }) {
    return setTournamentStatus(input);
  }

  static setArenaGroupOrder(input: SetArenaGroupOrderDTO) {
    return setArenaGroupOrder(input);
  }

  static moveGroupBetweenArenas(input: MoveGroupArenaDTO) {
    return moveGroupBetweenArenas(input);
  }

  static ensureArenaSlot(input: EnsureArenaSlotDTO) {
    return ensureArenaSlot(input);
  }

  static retireArena(input: RetireArenaDTO) {
    return retireArena(input);
  }

  static deleteTournament(id: string) {
    return deleteTournament(id);
  }
}
