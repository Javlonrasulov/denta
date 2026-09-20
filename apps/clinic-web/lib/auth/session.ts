import type { AuthSession, ClinicAuthUser } from './types';

export const SESSION_COOKIE = 'denta.clinic.session';
export const SESSION_STORAGE_KEY = 'denta.clinic.session.v1';
export const ACCOUNTS_STORAGE_KEY = 'denta.clinic.accounts.v1';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function canUseDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function setSessionCookie(token: string): void {
  if (!canUseDom()) return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

export function clearSessionCookie(): void {
  if (!canUseDom()) return;
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function readSessionCookie(): string | null {
  if (!canUseDom()) return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(SESSION_COOKIE.length + 1));
}

export function persistSession(session: AuthSession): void {
  if (!canUseDom()) return;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  setSessionCookie(session.accessToken);
}

export function clearPersistedSession(): void {
  if (!canUseDom()) return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  clearSessionCookie();
}

export function readPersistedSession(): AuthSession | null {
  if (!canUseDom()) return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function updatePersistedUser(user: ClinicAuthUser): AuthSession | null {
  const session = readPersistedSession();
  if (!session) return null;
  const next = { ...session, user };
  persistSession(next);
  return next;
}
