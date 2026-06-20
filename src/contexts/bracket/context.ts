import { createContext } from 'react';
import type { MatchData } from '@/contracts/tournament/match';
import type { TournamentAthleteData } from '@/contracts/tournament/division';

export interface BracketContextValue {
  matches: Array<MatchData>;
  athleteMap: Map<string, TournamentAthleteData>;
  matchLabel: ReadonlyMap<string, number | null>;
  readOnly: boolean;
  thirdPlaceId: string | undefined;
  onSlotClick: (match: MatchData) => void;
  onToggleLock: (
    matchId: string,
    side: 'red' | 'blue',
    locked: boolean
  ) => void;
}

export const BracketContext = createContext<BracketContextValue | null>(null);
