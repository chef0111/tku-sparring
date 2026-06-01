import type { Theme } from './context';

export type ResolvedTheme = 'light' | 'dark';

let storageKey = 'start-theme';
let defaultTheme: Theme = 'dark';
let theme: Theme = defaultTheme;
let resolved: ResolvedTheme = 'dark';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function resolveTheme(value: Theme): ResolvedTheme {
  if (typeof window === 'undefined') {
    return value === 'light' ? 'light' : 'dark';
  }

  return value === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    : value;
}

export function initThemeStore(key: string, fallback: Theme) {
  storageKey = key;
  defaultTheme = fallback;
  theme = fallback;
  resolved = resolveTheme(fallback);

  if (typeof window === 'undefined') return;

  const stored = localStorage.getItem(key);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    theme = stored;
    resolved = resolveTheme(stored);
  }

  notify();
}

export function getTheme() {
  return theme;
}

export function getResolvedTheme() {
  return resolved;
}

export function setTheme(next: Theme) {
  theme = next;
  resolved = resolveTheme(next);

  if (typeof window !== 'undefined') {
    localStorage.setItem(storageKey, next);
  }

  notify();
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getThemeScript(key: string, fallback: Theme) {
  const storage = JSON.stringify(key);
  const defaultValue = JSON.stringify(fallback);

  return `(function(){try{var t=localStorage.getItem(${storage});if(t!=='light'&&t!=='dark'&&t!=='system'){t=${defaultValue}}var d=matchMedia('(prefers-color-scheme: dark)').matches;var r=t==='system'?(d?'dark':'light'):t;var els=[document.documentElement,document.body];for(var i=0;i<els.length;i++){var e=els[i];if(!e)continue;e.classList.remove('light','dark');e.classList.add(r);e.style.colorScheme=r}}catch(e){}})();`;
}
