/**
 * Real auth for Client + Doctor Expo apps.
 * Tokens in SecureStore; refresh on 401.
 */
import { LOCKED_ROLE } from '@/constants/appVariant';
import {
  apiBaseUrl,
  apiPost,
  apiGet,
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
  user: Record<string, unknown>;
};

export async function loginWithPassword(
  identifier: string,
  password: string,
): Promise<void> {
  if (useMockApi()) {
    // Dev-only mock login when API URL unset
    useSettingsStore.getState().login({
      name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
      login: identifier,
      password,
    });
    if (LOCKED_ROLE) useSettingsStore.getState().setRole(LOCKED_ROLE);
    return;
  }

  const result = await apiPost<{
    session: {
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
      user: Record<string, unknown>;
    } | null;
    requiresEmailVerification?: boolean;
    email?: string;
  }>(
    '/auth/login',
    { identifier, password },
    false,
  );

  if (result.requiresEmailVerification) {
    throw new ApiError('Email not verified', 403, 'EMAIL_NOT_VERIFIED');
  }
  if (!result.session?.accessToken) {
    throw new ApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  await setTokens(result.session.accessToken, result.session.refreshToken);

  const me = await apiGet<AuthMeResponse>('/auth/me');
  applyMeToStores(me, identifier);
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
  const u = me.user;
  const first =
    (u.adminFirstName as string) ||
    (u.firstName as string) ||
    (u.fullName as string)?.split(' ')[0] ||
    'User';
  const last =
    (u.adminLastName as string) || (u.lastName as string) || '';
  const email = (u.email as string) || fallbackLogin || '';
  const phone = (u.phone as string) || '';
  const id = (u.id as string) || '';

  useSettingsStore.getState().login({
    name: `${first} ${last}`.trim(),
    login: email || phone,
    password: '',
  });

  if (me.role === 'doctor') {
    useSettingsStore.getState().setRole('doctor');
  } else if (me.role === 'patient') {
    useSettingsStore.getState().setRole('client');
    useUserStore.getState().setProfile({
      id,
      fullName: `${first} ${last}`.trim(),
      phone,
      avatarUrl: (u.avatarUrl as string) || undefined,
    });
  } else if (LOCKED_ROLE) {
    useSettingsStore.getState().setRole(LOCKED_ROLE);
  }
}
