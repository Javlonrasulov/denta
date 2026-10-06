import { clearPersistedSession, persistSession, readPersistedSession } from './session';

export const SESSION_EXPIRED_EVENT = 'denta:session-expired';

const LOCK_NAME = 'denta.clinic.token-refresh';

let inflight: Promise<string | null> | null = null;

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
}

/**
 * Exchanges the stored refresh token for a new access token.
 * The API rotates refresh tokens, so concurrent callers (and other tabs) must share one exchange.
 * Resolves to the new access token, or null when the session can't be renewed.
 */
export function refreshAccessToken(staleAccessToken: string | null): Promise<string | null> {
  if (!inflight) {
    inflight = withCrossTabLock(() => exchange(staleAccessToken)).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks) return fn();
  return locks.request(LOCK_NAME, fn);
}

async function exchange(staleAccessToken: string | null): Promise<string | null> {
  const session = readPersistedSession();
  if (!session?.refreshToken) return null;
  if (staleAccessToken && session.accessToken !== staleAccessToken) {
    return session.accessToken;
  }

  let res: Response;
  try {
    res = await fetch(`${apiBase()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
  } catch {
    return null;
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearPersistedSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return null;
  }

  const next = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
  persistSession({
    ...session,
    accessToken: next.accessToken,
    refreshToken: next.refreshToken,
    expiresAt: next.expiresAt,
  });
  return next.accessToken;
}
