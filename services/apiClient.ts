/**
 * Real HTTP API client for Expo apps (Client + Doctor).
 *
 * Mocks only when EXPO_PUBLIC_USE_MOCK_API=true AND not production.
 * Empty API URL in production must not silently enable mocks.
 */

import * as SecureStore from 'expo-secure-store';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    status = 500,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const ACCESS_KEY = 'denta.accessToken';
const REFRESH_KEY = 'denta.refreshToken';

let refreshInFlight: Promise<boolean> | null = null;

function isDevRuntime(): boolean {
  if (typeof __DEV__ !== 'undefined') return Boolean(__DEV__);
  return process.env.NODE_ENV !== 'production';
}

export function useMockApi(): boolean {
  return (
    process.env.EXPO_PUBLIC_USE_MOCK_API === 'true' && isDevRuntime()
  );
}

export function apiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
}

/** Call on app startup in release builds — empty URL must fail loudly. */
export function assertApiConfigured(): void {
  if (!apiBaseUrl()) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is required. Mocks are disabled outside development.',
    );
  }
}

export async function apiDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockNetworkDelay(): Promise<void> {
  const ms = 300 + Math.floor(Math.random() * 301);
  return apiDelay(ms);
}

export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_KEY);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

type RequestOpts = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
  _retried?: boolean;
};

function buildUrl(path: string, query?: RequestOpts['query']): string {
  const base = apiBaseUrl();
  const url = new URL(
    path.startsWith('/') ? `${base}${path}` : `${base}/${path}`,
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!refresh) return false;
      const res = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) return false;
      const body = (await res.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };
      if (!body.accessToken || !body.refreshToken) return false;
      await setTokens(body.accessToken, body.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  opts: RequestOpts = {},
): Promise<T> {
  if (useMockApi()) {
    throw new ApiError(
      'Mock mode active — service should not call apiRequest',
      500,
      'MOCK_MODE',
    );
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (opts.auth !== false) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (
    res.status === 401 &&
    opts.auth !== false &&
    !opts._retried &&
    path !== '/auth/refresh' &&
    path !== '/auth/login'
  ) {
    const ok = await refreshAccessToken();
    if (ok) {
      return apiRequest<T>(path, { ...opts, _retried: true });
    }
  }

  if (res.status === 204) return undefined as T;

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!res.ok) {
    const err = payload as {
      message?: string;
      code?: string;
      details?: unknown;
    } | null;
    throw new ApiError(
      err?.message ?? `HTTP ${res.status}`,
      res.status,
      err?.code,
      err?.details,
    );
  }

  return payload as T;
}

export const apiGet = <T>(
  path: string,
  query?: RequestOpts['query'],
  auth = true,
) => apiRequest<T>(path, { method: 'GET', query, auth });

export const apiPost = <T>(path: string, body?: unknown, auth = true) =>
  apiRequest<T>(path, { method: 'POST', body, auth });

export const apiPatch = <T>(path: string, body?: unknown, auth = true) =>
  apiRequest<T>(path, { method: 'PATCH', body, auth });

export const apiPut = <T>(path: string, body?: unknown, auth = true) =>
  apiRequest<T>(path, { method: 'PUT', body, auth });

export const apiDelete = <T>(path: string, body?: unknown, auth = true) =>
  apiRequest<T>(path, { method: 'DELETE', body, auth });
