import { BuilderWorkspaceContext } from './context';
import type { ReactNode } from 'react';
import type { BuilderWorkspaceContextValue } from './context';

export interface BuilderWorkspaceProviderProps extends BuilderWorkspaceContextValue {
  children: ReactNode;
}

export function BuilderWorkspaceProvider({
  children,
  ...value
}: BuilderWorkspaceProviderProps) {
  return (
    <BuilderWorkspaceContext.Provider value={value}>
      {children}
    </BuilderWorkspaceContext.Provider>
  );
}
