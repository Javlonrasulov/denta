'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  AuthError,
  getAuthService,
  isAuthMockMode,
  type AuthService,
  type ClinicAuthUser,
  type LoginResult,
  type RegisterClinicInput,
  type ResetPasswordInput,
  type SubscriptionStatusDto,
  type VerifyEmailInput,
} from '@/lib/auth';

interface AuthContextValue {
  user: ClinicAuthUser | null;
  subscription: SubscriptionStatusDto | null;
  loading: boolean;
  ready: boolean;
  isMock: boolean;
  service: AuthService;
  refresh: () => Promise<void>;
  registerClinic: (input: RegisterClinicInput) => Promise<{ email: string; resendAvailableIn: number }>;
  verifyEmail: (input: VerifyEmailInput) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<{ resendAvailableIn: number }>;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ resendAvailableIn: number }>;
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
  updateOnboarding: (step: number, completed?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const service = useMemo(() => getAuthService(), []);
  const [user, setUser] = useState<ClinicAuthUser | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const me = await service.getCurrentUser();
      setUser(me);
      if (me) {
        const sub = await service.getSubscriptionStatus();
        setSubscription(sub);
      } else {
        setSubscription(null);
      }
    } catch {
      setUser(null);
      setSubscription(null);
    }
  }, [service]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } finally {
        if (!cancelled) {
          setLoading(false);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      subscription,
      loading,
      ready,
      isMock: isAuthMockMode(),
      service,
      refresh,
      async registerClinic(input) {
        return service.registerClinic(input);
      },
      async verifyEmail(input) {
        await service.verifyEmail(input);
        await refresh();
      },
      async resendVerificationCode(email) {
        return service.resendVerificationCode(email);
      },
      async login(identifier, password) {
        const result = await service.login(identifier, password);
        if (result.session) await refresh();
        return result;
      },
      async logout() {
        await service.logout();
        setUser(null);
        setSubscription(null);
      },
      async forgotPassword(email) {
        return service.forgotPassword(email);
      },
      async resetPassword(input) {
        await service.resetPassword(input);
        setUser(null);
        setSubscription(null);
      },
      async updateOnboarding(step, completed) {
        const next = await service.updateOnboarding(step, completed);
        setUser(next);
      },
    }),
    [user, subscription, loading, ready, service, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function mapAuthError(
  err: unknown,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (err instanceof AuthError) {
    const seconds = typeof err.meta?.seconds === 'number' ? err.meta.seconds : undefined;
    switch (err.code) {
      case 'INVALID_EMAIL':
        return t('clinicAuth.errors.invalid_email');
      case 'INVALID_PHONE':
        return t('clinicAuth.errors.invalid_phone');
      case 'INVALID_PASSWORD':
        return t('clinicAuth.errors.invalid_password');
      case 'PASSWORD_MISMATCH':
        return t('clinicAuth.errors.password_mismatch');
      case 'TERMS_REQUIRED':
        return t('clinicAuth.errors.terms_required');
      case 'EMAIL_TAKEN':
        return t('clinicAuth.errors.email_taken');
      case 'PHONE_TAKEN':
        return t('clinicAuth.errors.phone_taken');
      case 'INVALID_CREDENTIALS':
        return t('clinicAuth.errors.invalid_credentials');
      case 'EMAIL_NOT_VERIFIED':
        return t('clinicAuth.errors.email_not_verified');
      case 'INVALID_CODE':
        return t('clinicAuth.errors.invalid_code');
      case 'CODE_EXPIRED':
        return t('clinicAuth.errors.code_expired');
      case 'RESEND_COOLDOWN':
        return t('clinicAuth.errors.resend_cooldown', { seconds: seconds ?? 60 });
      case 'RATE_LIMITED':
        return t('clinicAuth.errors.rate_limited');
      case 'NOT_FOUND':
        return t('clinicAuth.errors.not_found');
      case 'NETWORK':
        return t('clinicAuth.errors.network');
      default:
        return t('clinicAuth.errors.unknown');
    }
  }
  return t('clinicAuth.errors.unknown');
}
