import * as React from 'react';
import { BracketContext } from './context';
import type { BracketContextValue } from './context';

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
