import { createContext } from 'react';
import type { GroupData } from '@/contracts/tournament/group';

export interface BuilderWorkspaceContextValue {
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
  tournamentStatus: string;
}

export const BuilderWorkspaceContext = createContext<
  BuilderWorkspaceContextValue | undefined
>(undefined);
