import { createContext } from 'react';
import type { DivisionData } from '@/contracts/tournament/division';

export interface BuilderWorkspaceContextValue {
  tournamentId: string;
  divisions: Array<DivisionData>;
  readOnly: boolean;
  tournamentStatus: string;
}

export const BuilderWorkspaceContext = createContext<
  BuilderWorkspaceContextValue | undefined
>(undefined);
