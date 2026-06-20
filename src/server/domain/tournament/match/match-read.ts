import { matchDisplayLabelFromDb, matchKindFromDb } from './match-kind';

export type MatchKind = 'bracket' | 'custom';

/** Normalized match row returned from mutation stores and read helpers. */
export type MatchRead = {
  id: string;
  kind: string;
  displayLabel: string | null;
  divisionId: string;
  tournamentId: string;
  round: number;
  matchIndex: number;
  status: string;
  redAthleteId: string | null;
  blueAthleteId: string | null;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  redWins: number;
  blueWins: number;
  winnerId: string | null;
  tournamentWinnerId: string | null;
  redLocked: boolean;
  blueLocked: boolean;
  cornersSwapped: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Match row loaded for policy checks before a mutation. */
export type MatchLoadRow = MatchRead & { tournamentStatus: string };

export function coalesceMatchRead<
  T extends {
    kind?: string | null;
    displayLabel?: string | null;
  },
>(m: T): T & { kind: MatchKind; displayLabel: string | null } {
  return {
    ...m,
    kind: matchKindFromDb(m.kind),
    displayLabel: matchDisplayLabelFromDb(m.displayLabel),
  };
}
