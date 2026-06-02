import { useContext } from 'react';
import { BracketChromeContext } from './context';
import type { BracketChromeContextValue } from './context';

export function useBracketChrome(): BracketChromeContextValue {
  const context = useContext(BracketChromeContext);
  if (!context) {
    throw new Error(
      'useBracketChrome must be used within BracketChromeProvider'
    );
  }
  return context;
}
