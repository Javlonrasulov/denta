/**
 * Real auth for Client + Doctor Expo apps.
 * Tokens in SecureStore; refresh on 401.
 */
import { LOCKED_ROLE } from '@/constants/appVariant';
import {
  apiBaseUrl,
  apiPost,
  apiGet,
  apiPatch,
  clearTokens,
  setTokens,
  getAccessToken,
  useMockApi,
  ApiError,
} from '@/services/apiClient';
import { useSettingsStore } from '@/store/settingsStore';
import { useUserStore } from '@/store/userStore';

export type AuthMeResponse = {
  role: 'clinic' | 'doctor' | 'patient';
  user?: Record<string, unknown>;
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string | null;
  phone?: string;
  avatarUrl?: string;
  patientId?: string;
};

type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  user?: Record<string, unknown>;
};

function mapAuthErrorCode(code?: string): string | undefined {
  if (!code) return undefined;
  switch (code) {
    case 'EMAIL_TAKEN':
      return 'EMAIL_ALREADY_EXISTS';
    case 'PHONE_TAKEN':
      return 'PHONE_ALREADY_EXISTS';
    case 'INVALID_PASSWORD':
      return 'WEAK_PASSWORD';
    case 'INVALID_CODE':
      return 'INVALID_OTP';
    case 'CODE_EXPIRED':
      return 'OTP_EXPIRED';
    default:
      return code;
  }
}

export function authErrorMessage(
  err: unknown,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (err instanceof ApiError) {
    const code = mapAuthErrorCode(err.code);
    const seconds =
      typeof (err.details as { seconds?: number } | undefined)?.seconds ===
      'number'
        ? (err.details as { seconds: number }).seconds
        : 60;
    switch (code) {
      case 'EMAIL_ALREADY_EXISTS':
        return t('auth.errors.email_exists');
      case 'PHONE_ALREADY_EXISTS':
        return t('auth.errors.phone_exists');
      case 'WEAK_PASSWORD':
        return t('auth.errors.weak_password');
      case 'INVALID_OTP':
        return t('auth.errors.invalid_otp');
      case 'OTP_EXPIRED':
        return t('auth.errors.otp_expired');
      case 'INVALID_PHONE':
        return t('auth.errors.invalid_phone');
      case 'INVALID_EMAIL':
        return t('auth.invalid_email');
      case 'INVALID_CREDENTIALS':
        return t('auth.invalid_credentials');
      case 'EMAIL_NOT_VERIFIED':
        return t('auth.errors.email_not_verified');
      case 'RESEND_COOLDOWN':
        return t('auth.errors.resend_cooldown', { seconds });
      case 'RATE_LIMITED':
        return t('auth.errors.rate_limited');
      default:
        if (err.status === 0 || err.message.toLowerCase().includes('network')) {
          return t('auth.errors.network');
        }
        return t('auth.errors.generic');
    }
  }
  if (err instanceof TypeError || (err instanceof Error && /network|fetch/i.test(err.message))) {
    return t('auth.errors.network');
  }
  return t('auth.errors.generic');
}

async function applySession(session: SessionPayload, fallbackLogin?: string) {
  await setTokens(session.accessToken, session.refreshToken);
  const me = await apiGet<AuthMeResponse>('/auth/me');
  applyMeToStores(me, fallbackLogin);
  void import('@/services/notificationService')
    .then((n) => n.registerDevicePushToken())
    .catch(() => undefined);
}

export async function loginWithPassword(
  identifier: string,
  password: string,
): Promise<void> {
  if (useMockApi()) {
    useSettingsStore.getState().login({
      name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
      login: identifier,
      password,
    });
    if (LOCKED_ROLE) useSettingsStore.getState().setRole(LOCKED_ROLE);
    useSettingsStore.getState().setPatientOnboardingDone(true);
    return;
  }

  const result = await apiPost<{
    session: SessionPayload | null;
    requiresEmailVerification?: boolean;
    email?: string;
  }>(
    '/auth/login',
    { identifier, password },
    false,
  );

  if (result.requiresEmailVerification) {
    throw new ApiError(
      'Email not verified',
      403,
      'EMAIL_NOT_VERIFIED',
      { email: result.email },
    );
  }
  if (!result.session?.accessToken) {
    throw new ApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  await applySession(result.session, identifier);
}

export async function registerPatient(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<void> {
  if (useMockApi()) {
    useSettingsStore.getState().setPatientOnboardingDone(false);
    useSettingsStore.getState().login({
      name: `${input.firstName} ${input.lastName}`.trim(),
      login: input.email.trim().toLowerCase(),
      password: '',
    });
    if (LOCKED_ROLE) useSettingsStore.getState().setRole(LOCKED_ROLE);
    useUserStore.getState().setProfile({
      fullName: `${input.firstName} ${input.lastName}`.trim(),
      phone: input.phone,
    });
    return;
  }
  try {
    const session = await apiPost<{
      accessToken: string;
      refreshToken: string;
      expiresAt?: string;
      user?: Record<string, unknown>;
    }>('/auth/patient/register', input, false);
    if (!session.accessToken) {
      throw new ApiError('Registration failed', 400, 'UNKNOWN');
    }
    useSettingsStore.getState().setPatientOnboardingDone(false);
    await applySession(session, input.email.trim().toLowerCase());
  } catch (err) {
    if (err instanceof ApiError && err.code) {
      throw new ApiError(
        err.message,
        err.status,
        mapAuthErrorCode(err.code),
        err.details,
      );
    }
    throw err;
  }
}

export async function verifyPatientEmail(
  email: string,
  code: string,
): Promise<void> {
  if (useMockApi()) {
    return;
  }

  try {
    const keepOnboarding =
      useSettingsStore.getState().isAuthenticated &&
      useSettingsStore.getState().patientOnboardingDone;
    const session = await apiPost<SessionPayload>(
      '/auth/patient/verify-email',
      { email, code },
      false,
    );
    if (!session.accessToken) {
      throw new ApiError('Verification failed', 400, 'INVALID_OTP');
    }
    await applySession(session, email);
    if (keepOnboarding) {
      useSettingsStore.getState().setPatientOnboardingDone(true);
    }
  } catch (err) {
    if (err instanceof ApiError && err.code) {
      throw new ApiError(
        err.message,
        err.status,
        mapAuthErrorCode(err.code),
        err.details,
      );
    }
    throw err;
  }
}

export async function resendPatientVerification(
  email: string,
): Promise<{ resendAvailableIn: number }> {
  if (useMockApi()) {
    return { resendAvailableIn: 60 };
  }
  try {
    return await apiPost<{ resendAvailableIn: number }>(
      '/auth/patient/resend-verification',
      { email },
      false,
    );
  } catch (err) {
    if (err instanceof ApiError && err.code) {
      throw new ApiError(
        err.message,
        err.status,
        mapAuthErrorCode(err.code),
        err.details,
      );
    }
    throw err;
  }
}

export async function updatePatientProfile(payload: {
  avatarUrl?: string;
  gender?: 'MALE' | 'FEMALE';
  birthDate?: string;
}): Promise<void> {
  if (useMockApi()) return;
  await apiPatch('/auth/patient/profile', payload);
}

export async function restoreSession(): Promise<boolean> {
  if (useMockApi()) {
    return useSettingsStore.getState().isAuthenticated;
  }
  const token = await getAccessToken();
  if (!token) return false;
  try {
    const me = await apiGet<AuthMeResponse>('/auth/me');
    applyMeToStores(me);
    void import('@/services/notificationService')
      .then((n) => n.registerDevicePushToken())
      .catch(() => undefined);
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const ok = await tryRefresh();
      if (!ok) {
        await logout();
        return false;
      }
      const me = await apiGet<AuthMeResponse>('/auth/me');
      applyMeToStores(me);
      void import('@/services/notificationService')
        .then((n) => n.registerDevicePushToken())
        .catch(() => undefined);
      return true;
    }
    await logout();
    return false;
  }
}

export async function tryRefresh(): Promise<boolean> {
  if (useMockApi() || !apiBaseUrl()) return false;
  try {
    const SecureStore = await import('expo-secure-store');
    const refresh = await SecureStore.getItemAsync('denta.refreshToken');
    if (!refresh) return false;
    const session = await apiPost<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', { refreshToken: refresh }, false);
    await setTokens(session.accessToken, session.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    if (!useMockApi()) {
      await import('@/services/notificationService')
        .then((n) => n.unregisterDevicePushToken())
        .catch(() => undefined);
      const refresh = await (
        await import('expo-secure-store')
      ).getItemAsync('denta.refreshToken');
      await apiPost('/auth/logout', { refreshToken: refresh }).catch(() => undefined);
    }
  } finally {
    await clearTokens();
    useSettingsStore.getState().logout();
  }
}

function applyMeToStores(me: AuthMeResponse, fallbackLogin?: string) {
  const u = (me.user ?? me) as Record<string, unknown>;
  const first =
    (u.adminFirstName as string) ||
    (u.firstName as string) ||
    (me.firstName as string) ||
    (u.fullName as string)?.split(' ')[0] ||
    'User';
  const last =
    (u.adminLastName as string) ||
    (u.lastName as string) ||
    (me.lastName as string) ||
    '';
  const email =
    (u.email as string) || (me.email as string) || fallbackLogin || '';
  const phone = (u.phone as string) || (me.phone as string) || '';
  const id = (u.id as string) || (me.id as string) || '';
  const role = me.role;

  useSettingsStore.getState().login({
    name: `${first} ${last}`.trim(),
    login: email || phone,
    password: '',
  });

  if (role === 'doctor') {
    useSettingsStore.getState().setRole('doctor');
  } else if (role === 'patient') {
    useSettingsStore.getState().setRole('client');
    useUserStore.getState().setProfile({
      id,
      fullName: `${first} ${last}`.trim(),
      phone,
      avatarUrl: (u.avatarUrl as string) || (me.avatarUrl as string) || undefined,
    });
  } else if (LOCKED_ROLE) {
    useSettingsStore.getState().setRole(LOCKED_ROLE);
  }
}
