import {
  clearPersistedSession,
  persistSession,
  readPersistedSession,
  updatePersistedUser,
} from './session';
import {
  AuthError,
  type AuthErrorCode,
  type AuthService,
  type AuthSession,
  type ClinicAuthUser,
  type RegisterClinicInput,
  type ResetPasswordInput,
  type SubscriptionStatusDto,
  type VerifyEmailInput,
} from './types';

/**
 * Real HTTP auth client.
 * Expects NestJS (or compatible) API at NEXT_PUBLIC_API_URL.
 *
 * Suggested contract:
 * POST /auth/clinic/register
 * POST /auth/email/verify
 * POST /auth/email/resend
 * POST /auth/login
 * POST /auth/logout
 * POST /auth/forgot-password
 * POST /auth/reset-password
 * GET  /auth/me
 * GET  /subscription/status
 * PATCH /auth/onboarding
 */

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
}

async function request<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, { ...rest, headers, credentials: 'include' });
  } catch {
    throw new AuthError('NETWORK');
  }

  if (!res.ok) {
    let code: AuthErrorCode = 'UNKNOWN';
    let meta: Record<string, unknown> | undefined;
    try {
      const body = (await res.json()) as { code?: AuthErrorCode; meta?: Record<string, unknown> };
      if (body.code) code = body.code;
      meta = body.meta;
    } catch {
      /* ignore */
    }
    throw new AuthError(code, undefined, meta);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function currentToken(): string | null {
  return readPersistedSession()?.accessToken ?? null;
}

export function createApiAuthService(): AuthService {
  return {
    async registerClinic(input: RegisterClinicInput) {
      return request<{ email: string; resendAvailableIn: number }>('/auth/clinic/register', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async verifyEmail(input: VerifyEmailInput) {
      const session = await request<AuthSession>('/auth/email/verify', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      persistSession(session);
      return session;
    },

    async resendVerificationCode(email: string) {
      return request<{ resendAvailableIn: number }>('/auth/email/resend', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    async login(identifier: string, password: string) {
      const result = await request<{
        session: AuthSession | null;
        requiresEmailVerification: boolean;
        email?: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      if (result.session) persistSession(result.session);
      return result;
    },

    async logout() {
      try {
        await request<void>('/auth/logout', {
          method: 'POST',
          token: currentToken(),
        });
      } finally {
        clearPersistedSession();
      }
    },

    async forgotPassword(email: string) {
      return request<{ resendAvailableIn: number }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    async verifyResetCode(email: string, code: string) {
      return request<{ resetToken: string }>('/auth/reset-password/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
    },

    async resetPassword(input: ResetPasswordInput) {
      await request<void>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      clearPersistedSession();
    },

    async getCurrentUser() {
      const token = currentToken();
      if (!token) return null;
      try {
        const user = await request<ClinicAuthUser>('/auth/me', {
          method: 'GET',
          token,
        });
        updatePersistedUser(user);
        return user;
      } catch (e) {
        if (e instanceof AuthError && (e.code === 'UNAUTHORIZED' || e.code === 'NETWORK')) {
          clearPersistedSession();
          return null;
        }
        throw e;
      }
    },

    async getSubscriptionStatus() {
      const token = currentToken();
      if (!token) return null;
      return request<SubscriptionStatusDto>('/subscription/status', {
        method: 'GET',
        token,
      });
    },

    async updateOnboarding(step: number, completed?: boolean) {
      const user = await request<ClinicAuthUser>('/auth/onboarding', {
        method: 'PATCH',
        token: currentToken(),
        body: JSON.stringify({ step, completed }),
      });
      updatePersistedUser(user);
      return user;
    },
  };
}
