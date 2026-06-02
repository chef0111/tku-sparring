import { useLayoutEffect, useSyncExternalStore } from 'react';
import { ScriptOnce } from '@tanstack/react-router';
import {
  getTheme,
  getThemeScript,
  initThemeStore,
  setTheme,
  subscribeTheme,
} from './theme-store';
import { ThemeProviderContext } from './context';
import type { Theme } from './context';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}: ThemeProviderProps) {
  useLayoutEffect(() => {
    initThemeStore(storageKey, defaultTheme);
  }, [defaultTheme, storageKey]);

  const theme = useSyncExternalStore(
    subscribeTheme,
    getTheme,
    () => defaultTheme
  );

  useLayoutEffect(() => {
    if (theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  return (
    <ThemeProviderContext value={{ theme, setTheme }}>
      <ScriptOnce>{getThemeScript(storageKey, defaultTheme)}</ScriptOnce>
      {children}
    </ThemeProviderContext>
  );
}
