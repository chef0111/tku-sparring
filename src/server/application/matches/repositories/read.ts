import type { MatchRead } from '@/server/domain/tournament/match/match-read';

export type MatchReadStore = {
  findByDivisionId: (divisionId: string) => Promise<Array<MatchRead>>;
  findByTournamentId: (tournamentId: string) => Promise<Array<MatchRead>>;
  findById: (id: string) => Promise<MatchRead | null>;
};
