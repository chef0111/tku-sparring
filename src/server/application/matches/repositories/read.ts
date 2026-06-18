import type { MatchRead } from '@/server/domain/tournament/match/match-read';

export type MatchReadStore = {
  findByGroupId: (groupId: string) => Promise<Array<MatchRead>>;
  findByTournamentId: (tournamentId: string) => Promise<Array<MatchRead>>;
  findById: (id: string) => Promise<MatchRead | null>;
};
