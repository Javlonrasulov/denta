'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  THEME_STORAGE_KEY,
  applyTheme,
  isThemePreference,
  readStoredTheme,
  resolveTheme,
  watchSystemTheme,
  writeStoredTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme';

type ThemeContextValue = {
  /** What the user picked (`system` follows the OS). */
  preference: ThemePreference;
  /** What is actually painted. */
  theme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function initialResolved(): ResolvedTheme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [theme, setTheme] = useState<ResolvedTheme>(initialResolved);

  useEffect(() => {
    const stored = readStoredTheme();
    setPreferenceState(stored);
    setTheme(resolveTheme(stored));
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (preference !== 'system') return;
    return watchSystemTheme(setTheme);
  }, [preference]);

  // Keep every open tab in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const next = isThemePreference(event.newValue) ? event.newValue : 'system';
      setPreferenceState(next);
      setTheme(resolveTheme(next));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    writeStoredTheme(next);
    setPreferenceState(next);
    const resolved = resolveTheme(next);
    applyTheme(resolved);
    setTheme(resolved);
  }, []);

  const toggle = useCallback(() => {
    setPreference(theme === 'dark' ? 'light' : 'dark');
  }, [setPreference, theme]);

  const value = useMemo(
    () => ({ preference, theme, setPreference, toggle }),
    [preference, theme, setPreference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
