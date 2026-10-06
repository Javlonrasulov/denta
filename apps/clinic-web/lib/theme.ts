export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'denta.clinic-web.theme';
export const THEME_PREFERENCES: ThemePreference[] = ['light', 'dark', 'system'];

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function readStoredTheme(): ThemePreference {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
}

export function writeStoredTheme(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* storage unavailable — keep in-memory choice */
  }
}

export function systemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference;
}

export function watchSystemTheme(onChange: (theme: ResolvedTheme) => void): () => void {
  const mq = window.matchMedia(DARK_QUERY);
  const listener = () => onChange(mq.matches ? 'dark' : 'light');
  mq.addEventListener('change', listener);
  return () => mq.removeEventListener('change', listener);
}

/** Applies the theme to `<html>` with all transitions suppressed for that frame. */
export function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement;
  if (root.classList.contains(theme) && root.dataset.theme === theme) return;
  root.classList.add('theme-switching');
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  // Force a style flush before re-enabling transitions.
  void window.getComputedStyle(root).opacity;
  requestAnimationFrame(() => root.classList.remove('theme-switching'));
}

/** Runs before hydration so the first paint already uses the stored theme (no flash). */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');if(p!=='light'&&p!=='dark')p=window.matchMedia('${DARK_QUERY}').matches?'dark':'light';var r=document.documentElement;r.classList.add(p);r.dataset.theme=p;r.style.colorScheme=p;}catch(e){}})();`;
