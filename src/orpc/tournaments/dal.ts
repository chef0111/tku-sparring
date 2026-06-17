import { findTournamentById } from './tournament-lifecycle';
import { listTournaments } from './tournament-list';
import type { ListTournamentsDTO } from './dto';

export class TournamentDAL {
  static findMany(input: ListTournamentsDTO) {
    return listTournaments(input);
  }

  static findById(id: string) {
    return findTournamentById(id);
  }
}
