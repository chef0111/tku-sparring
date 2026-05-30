import type { Prisma } from '@prisma/client';
import type { MatchData } from '@/features/dashboard/types';
import {
  matchDisplayLabelFromDb,
  matchKindFromDb,
} from '@/lib/tournament/match-kind';

/** Fields required to build {@link MatchData} for arena labels and bracket tooling. */
export const matchProjectionSelect = {
  id: true,
  kind: true,
  displayLabel: true,
  round: true,
  matchIndex: true,
  status: true,
  redAthleteId: true,
  blueAthleteId: true,
  redTournamentAthleteId: true,
  blueTournamentAthleteId: true,
  redWins: true,
  blueWins: true,
  winnerId: true,
  tournamentWinnerId: true,
  redLocked: true,
  blueLocked: true,
  updatedAt: true,
  groupId: true,
  tournamentId: true,
} as const satisfies Prisma.MatchSelect;

export type MatchProjectionRow = Prisma.MatchGetPayload<{
  select: typeof matchProjectionSelect;
}> & {
  arenaSequenceRank?: number | null;
};

export function toMatchData(m: MatchProjectionRow): MatchData {
  return {
    id: m.id,
    kind: matchKindFromDb(m.kind),
    displayLabel: matchDisplayLabelFromDb(m.displayLabel),
    round: m.round,
    matchIndex: m.matchIndex,
    status: m.status as MatchData['status'],
    redAthleteId: m.redAthleteId,
    blueAthleteId: m.blueAthleteId,
    redTournamentAthleteId: m.redTournamentAthleteId,
    blueTournamentAthleteId: m.blueTournamentAthleteId,
    redWins: m.redWins,
    blueWins: m.blueWins,
    winnerId: m.winnerId,
    tournamentWinnerId: m.tournamentWinnerId,
    redLocked: m.redLocked,
    blueLocked: m.blueLocked,
    updatedAt: m.updatedAt,
    groupId: m.groupId,
    tournamentId: m.tournamentId,
    arenaSequenceRank: m.arenaSequenceRank ?? null,
  };
}
