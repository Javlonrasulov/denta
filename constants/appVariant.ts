import Constants from 'expo-constants';

import type { UserRole } from '@/types';

export type AppVariant = 'client' | 'doctor' | 'clinic';

/** Build-time app flavor from `APP_VARIANT` (see app.config.ts). */
export const APP_VARIANT: AppVariant =
  (Constants.expoConfig?.extra?.appVariant as AppVariant | undefined) ?? 'clinic';

export const LOCKED_ROLE: UserRole | null =
  APP_VARIANT === 'client' || APP_VARIANT === 'doctor' ? APP_VARIANT : null;

export const APP_DISPLAY_NAME =
  Constants.expoConfig?.name ??
  (APP_VARIANT === 'doctor' ? 'Denta Doctor' : APP_VARIANT === 'client' ? 'Denta' : 'DENTA.UZ');

export function roleHomeHref(role: UserRole) {
  if (role === 'client') return '/(client)/(tabs)' as const;
  if (role === 'doctor') return '/(doctor)/(tabs)' as const;
  return '/(clinic)/(shell)/overview' as const;
}
