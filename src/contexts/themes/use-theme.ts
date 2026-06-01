import { useContext, useSyncExternalStore } from 'react';
import { ThemeProviderContext } from './context';
import { getResolvedTheme, subscribeTheme } from './theme-store';

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

export function useResolvedTheme() {
  return useSyncExternalStore(
    subscribeTheme,
    getResolvedTheme,
    () => 'dark' as const
  );
}
