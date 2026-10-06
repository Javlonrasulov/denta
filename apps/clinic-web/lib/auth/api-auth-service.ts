import {
  clearPersistedSession,
  persistSession,
  readPersistedSession,
  updatePersistedUser,
} from './session';
import { refreshAccessToken } from './token-refresh';
import {
  AuthError,
  type AuthErrorCode,
  type AuthService,
  type AuthSession,
  type ChangePasswordInput,
  type ChangePhoneInput,
  type ClinicAuthUser,
  type ConfirmEmailChangeInput,
  type RegisterClinicInput,
  type RequestEmailChangeInput,
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
  retried = false,
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

  if (res.status === 401 && token && !retried) {
    const fresh = await refreshAccessToken(token);
    if (fresh) return request<T>(path, { ...init, token: fresh }, true);
  }

  if (!res.ok) {
    let code: AuthErrorCode = 'UNKNOWN';
    let meta: Record<string, unknown> | undefined;
    try {
      const body = (await res.json()) as {
        code?: AuthErrorCode;
        meta?: Record<string, unknown>;
        details?: unknown;
      };
      if (body.code) code = body.code;
      meta =
        body.meta ??
        (body.details && typeof body.details === 'object'
          ? (body.details as Record<string, unknown>)
          : undefined);
    } catch {
      /* ignore */
    }
    throw new AuthError(code, undefined, meta);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

type AccountResponse = { user: ClinicAuthUser };

function currentToken(): string | null {
  return readPersistedSession()?.accessToken ?? null;
}

/** /auth/login and /auth/me are shared with the mobile apps; doctor/patient payloads have no subscription. */
function isClinicUser(user: unknown): user is ClinicAuthUser {
  if (!user || typeof user !== 'object') return false;
  const u = user as { role?: string; subscription?: unknown };
  return u.role !== 'doctor' && u.role !== 'patient' && Boolean(u.subscription);
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
      if (result.session && !isClinicUser(result.session.user)) {
        await request<void>('/auth/logout', {
          method: 'POST',
          token: result.session.accessToken,
        }).catch(() => undefined);
        clearPersistedSession();
        throw new AuthError('NOT_CLINIC_ACCOUNT');
      }
      if (result.session) persistSession(result.session);
      return {
        ...result,
        requiresWorkspaceSelection:
          result.session?.requiresWorkspaceSelection ||
          ((result.session?.workspaces?.length ?? 0) > 1 &&
            !result.session?.activeWorkspace),
      };
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
        const me = await request<{
          user: ClinicAuthUser;
          activeWorkspace?: AuthSession['activeWorkspace'];
          workspaces?: AuthSession['workspaces'];
        }>('/auth/me', {
          method: 'GET',
          token,
        });
        if (!isClinicUser(me.user)) {
          clearPersistedSession();
          return null;
        }
        const session = readPersistedSession();
        if (session) {
          persistSession({
            ...session,
            user: me.user,
            activeWorkspace: me.activeWorkspace ?? session.activeWorkspace,
            workspaces: me.workspaces ?? session.workspaces,
          });
        } else {
          updatePersistedUser(me.user);
        }
        return me.user;
      } catch (e) {
        if (e instanceof AuthError && e.code === 'UNAUTHORIZED') {
          clearPersistedSession();
          return null;
        }
        // An unreachable API (restart, flaky network) must not sign the user out.
        if (e instanceof AuthError && e.code === 'NETWORK') {
          return readPersistedSession()?.user ?? null;
        }
        throw e;
      }
    },

    async switchWorkspace(clinicId: string) {
      const session = await request<AuthSession>('/auth/workspace/switch', {
        method: 'POST',
        token: currentToken(),
        body: JSON.stringify({ clinicId }),
      });
      persistSession(session);
      return session;
    },

    getActivePermissions() {
      return readPersistedSession()?.activeWorkspace?.permissions ?? [];
    },

    getWorkspaces() {
      return Promise.resolve(readPersistedSession()?.workspaces ?? []);
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

    async changePassword(input: ChangePasswordInput) {
      const me = await request<AccountResponse>('/auth/account/password', {
        method: 'POST',
        token: currentToken(),
        body: JSON.stringify({
          ...input,
          refreshToken: readPersistedSession()?.refreshToken,
        }),
      });
      updatePersistedUser(me.user);
      return me.user;
    },

    async changePhone(input: ChangePhoneInput) {
      const me = await request<AccountResponse>('/auth/account/phone', {
        method: 'POST',
        token: currentToken(),
        body: JSON.stringify(input),
      });
      updatePersistedUser(me.user);
      return me.user;
    },

    async requestEmailChange(input: RequestEmailChangeInput) {
      return request<{ email: string; resendAvailableIn: number }>(
        '/auth/account/email/request',
        {
          method: 'POST',
          token: currentToken(),
          body: JSON.stringify(input),
        },
      );
    },

    async updateLocale(locale: string) {
      const token = currentToken();
      if (!token) return;
      await request<{ locale: string }>('/auth/account/locale', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ locale }),
      });
    },

    async confirmEmailChange(input: ConfirmEmailChangeInput) {
      const me = await request<AccountResponse>('/auth/account/email/confirm', {
        method: 'POST',
        token: currentToken(),
        body: JSON.stringify(input),
      });
      updatePersistedUser(me.user);
      return me.user;
    },
  };
}
