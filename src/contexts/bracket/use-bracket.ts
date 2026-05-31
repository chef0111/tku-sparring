import { useContext } from 'react';
import { BracketContext } from './context';

export function useBracket() {
  const context = useContext(BracketContext);
  if (!context) {
    throw new Error('useBracket must be used within BracketProvider');
  }
  return context;
}
