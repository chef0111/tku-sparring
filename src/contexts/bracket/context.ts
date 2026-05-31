import { createContext } from 'react';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';

export interface BracketContextValue {
  matches: Array<MatchData>;
  athleteMap: Map<string, TournamentAthleteData>;
  matchLabel: ReadonlyMap<string, number | null>;
  readOnly: boolean;
  onSlotClick: (match: MatchData) => void;
  onToggleLock: (
    matchId: string,
    side: 'red' | 'blue',
    locked: boolean
  ) => void;
}

export const BracketContext = createContext<BracketContextValue | null>(null);
