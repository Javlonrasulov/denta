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
  type ChangePasswordInput,
  type ChangePhoneInput,
  type ClinicAuthUser,
  type ConfirmEmailChangeInput,
  type LoginResult,
  type RegisterClinicInput,
  type RequestEmailChangeInput,
  type ResetPasswordInput,
  type SubscriptionStatusDto,
  type VerifyEmailInput,
} from '@/lib/auth';
import { SESSION_EXPIRED_EVENT } from '@/lib/auth/token-refresh';
import i18n, { resolveLocaleCode } from '@/lib/i18n';

interface AuthContextValue {
  user: ClinicAuthUser | null;
  subscription: SubscriptionStatusDto | null;
  loading: boolean;
  ready: boolean;
  isMock: boolean;
  service: AuthService;
  refresh: () => Promise<void>;
  getPermissions: () => string[];
  registerClinic: (input: RegisterClinicInput) => Promise<{ email: string; resendAvailableIn: number }>;
  verifyEmail: (input: VerifyEmailInput) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<{ resendAvailableIn: number }>;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ resendAvailableIn: number }>;
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
  updateOnboarding: (step: number, completed?: boolean) => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
  changePhone: (input: ChangePhoneInput) => Promise<void>;
  requestEmailChange: (
    input: RequestEmailChangeInput,
  ) => Promise<{ email: string; resendAvailableIn: number }>;
  confirmEmailChange: (input: ConfirmEmailChangeInput) => Promise<void>;
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
        const sub = await service.getSubscriptionStatus().catch(() => undefined);
        if (sub !== undefined) setSubscription(sub);
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

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setSubscription(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (!userId || !service.updateLocale) return;
    const sync = (lng: string) => {
      void service.updateLocale?.(resolveLocaleCode(lng)).catch(() => undefined);
    };
    sync(i18n.resolvedLanguage ?? i18n.language);
    i18n.on('languageChanged', sync);
    return () => {
      i18n.off('languageChanged', sync);
    };
  }, [userId, service]);

  useEffect(() => {
    if (!ready || !user) return;
    void import('@/lib/push')
      .then((m) => m.registerClinicWebPush())
      .catch(() => undefined);
  }, [ready, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      subscription,
      loading,
      ready,
      isMock: isAuthMockMode(),
      service,
      refresh,
      getPermissions: () => service.getActivePermissions?.() ?? [],
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
        if (result.session) {
          await refresh();
          void import('@/lib/push')
            .then((m) => m.registerClinicWebPush())
            .catch(() => undefined);
        }
        return result;
      },
      async logout() {
        await import('@/lib/push')
          .then((m) => m.unregisterClinicWebPush())
          .catch(() => undefined);
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
      async changePassword(input) {
        setUser(await service.changePassword(input));
      },
      async changePhone(input) {
        setUser(await service.changePhone(input));
      },
      async requestEmailChange(input) {
        return service.requestEmailChange(input);
      },
      async confirmEmailChange(input) {
        setUser(await service.confirmEmailChange(input));
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
      case 'LEGAL_CONSENT_REQUIRED':
        return err.meta?.outdated === true
          ? t('clinicAuth.errors.legal_version_outdated')
          : t('clinicAuth.errors.legal_consent_required');
      case 'EMAIL_TAKEN':
        return t('clinicAuth.errors.email_taken');
      case 'PHONE_TAKEN':
        return t('clinicAuth.errors.phone_taken');
      case 'INVALID_CREDENTIALS':
        return t('clinicAuth.errors.invalid_credentials');
      case 'EMAIL_NOT_VERIFIED':
        return t('clinicAuth.errors.email_not_verified');
      case 'EMAIL_NOT_REGISTERED':
        return t('clinicAuth.errors.email_not_registered');
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
      case 'NOT_CLINIC_ACCOUNT':
        return t('clinicAuth.errors.not_clinic_account');
      case 'WRONG_PASSWORD':
        return t('clinicAuth.errors.wrong_password');
      case 'SAME_PASSWORD':
        return t('clinicAuth.errors.same_password');
      case 'SAME_EMAIL':
        return t('clinicAuth.errors.same_email');
      case 'UNAUTHORIZED':
        return t('clinicAuth.errors.unauthorized');
      case 'NETWORK':
        return t('clinicAuth.errors.network');
      default:
        return t('clinicAuth.errors.unknown');
    }
  }
  return t('clinicAuth.errors.unknown');
}
