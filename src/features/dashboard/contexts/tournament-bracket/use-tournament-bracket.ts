import { useContext } from 'react';
import { TournamentBracketContext } from './context';
import type { TournamentBracketContextValue } from './context';

export function useTournamentBracket(): TournamentBracketContextValue {
  const context = useContext(TournamentBracketContext);
  if (!context) {
    throw new Error(
      'useTournamentBracket must be used within TournamentBracketProvider'
    );
  }
  return context;
}
