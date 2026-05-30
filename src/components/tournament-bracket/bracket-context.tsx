import * as React from 'react';
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

const BracketContext = React.createContext<BracketContextValue | null>(null);

export function BracketProvider({
  value,
  children,
}: {
  value: BracketContextValue;
  children: React.ReactNode;
}) {
  return (
    <BracketContext.Provider value={value}>{children}</BracketContext.Provider>
  );
}

export function useBracket() {
  const ctx = React.use(BracketContext);
  if (!ctx) {
    throw new Error('useBracket must be used within BracketProvider');
  }
  return ctx;
}
