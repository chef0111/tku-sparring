import { useContext } from 'react';
import { BuilderWorkspaceContext } from './context';
import type { BuilderWorkspaceContextValue } from './context';

export function useBuilderWorkspace(): BuilderWorkspaceContextValue {
  const context = useContext(BuilderWorkspaceContext);
  if (!context) {
    throw new Error(
      'useBuilderWorkspace must be used within BuilderWorkspaceProvider'
    );
  }
  return context;
}
