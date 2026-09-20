import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { UserRole } from '@/types';

export type AppVariant = 'client' | 'doctor' | 'clinic';

function variantFromPackage(pkg: string | null | undefined): AppVariant | null {
  if (!pkg) return null;
  if (pkg.endsWith('.doctor')) return 'doctor';
  if (pkg.endsWith('.client')) return 'client';
  if (pkg.endsWith('.clinic')) return 'clinic';
  return null;
}

function nativeApplicationId(): string | null {
  if (Platform.OS === 'web') return null;
  try {
    // Optional: missing from an older APK until the next native rebuild.
    return (require('expo-application') as typeof import('expo-application')).applicationId ?? null;
  } catch {
    return null;
  }
}

const fromNative = variantFromPackage(nativeApplicationId());
const fromConfig = Constants.expoConfig?.extra?.appVariant as AppVariant | undefined;
const fromPublicEnv = process.env.EXPO_PUBLIC_APP_VARIANT as AppVariant | undefined;

/** Native package wins (doctor APK stays doctor even if Metro was started as clinic). */
export const APP_VARIANT: AppVariant = fromNative ?? fromPublicEnv ?? fromConfig ?? 'clinic';

export const LOCKED_ROLE: UserRole | null =
  APP_VARIANT === 'client' || APP_VARIANT === 'doctor' ? APP_VARIANT : null;

export const APP_DISPLAY_NAME =
  Constants.expoConfig?.name ??
  (APP_VARIANT === 'doctor' ? 'Denta Doctor' : APP_VARIANT === 'client' ? 'Denta' : 'DENTA.UZ');

export const APP_VARIANT_LABEL =
  APP_VARIANT === 'doctor' ? 'Doctor' : APP_VARIANT === 'client' ? 'Client' : 'Clinic';

export function roleHomeHref(role: UserRole) {
  if (role === 'client') return '/(client)/(tabs)' as const;
  if (role === 'doctor') return '/(doctor)/(tabs)' as const;
  return '/(clinic)/(shell)/overview' as const;
}
