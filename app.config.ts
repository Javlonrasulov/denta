import type { ExpoConfig, ConfigContext } from 'expo/config';

export type AppVariant = 'client' | 'doctor' | 'clinic';

/** Mobile products only. Clinic CRM is Next.js at apps/clinic-web (port 3000). */
const VARIANT = (process.env.APP_VARIANT ?? 'doctor') as AppVariant;

const VARIANTS: Record<
  AppVariant,
  {
    name: string;
    slug: string;
    scheme: string;
    androidPackage: string;
    iosBundle: string;
  }
> = {
  client: {
    name: 'Denta',
    slug: 'denta-client',
    scheme: 'denta-client',
    androidPackage: 'uz.denta.client',
    iosBundle: 'uz.denta.client',
  },
  doctor: {
    name: 'Denta Doctor',
    slug: 'denta-doctor',
    scheme: 'denta-doctor',
    androidPackage: 'uz.denta.doctor',
    iosBundle: 'uz.denta.doctor',
  },
  clinic: {
    name: 'DENTA.UZ',
    slug: 'denta-clinic',
    scheme: 'denta-clinic',
    androidPackage: 'uz.denta.clinic',
    iosBundle: 'uz.denta.clinic',
  },
};

const selected = VARIANTS[VARIANT] ?? VARIANTS.clinic;

/**
 * Maps SDK requires a non-empty Android meta-data value or MapView can crash.
 * Real key from env; placeholder keeps native builds from crashing until configured.
 */
const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY?.trim() ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
  'REPLACE_WITH_GOOGLE_MAPS_API_KEY';

/** Optional Firebase client config paths (set in .env when files exist). */
const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON?.trim();
const GOOGLE_SERVICE_INFO_PLIST =
  process.env.GOOGLE_SERVICE_INFO_PLIST?.trim();

function fileExists(path: string): boolean {
  try {
    // Runtime Node (Expo config) — avoid static `fs` import for Expo tsc.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as { existsSync: (p: string) => boolean };
    return fs.existsSync(path);
  } catch {
    return false;
  }
}

const hasAndroidGoogleServices = Boolean(
  GOOGLE_SERVICES_JSON && fileExists(GOOGLE_SERVICES_JSON),
);
const hasIosGoogleServices = Boolean(
  GOOGLE_SERVICE_INFO_PLIST && fileExists(GOOGLE_SERVICE_INFO_PLIST),
);

export default ({
  config,
}: ConfigContext): ExpoConfig & { newArchEnabled?: boolean } => ({
  ...config,
  name: selected.name,
  slug: selected.slug,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: selected.scheme,
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: selected.iosBundle,
    ...(hasIosGoogleServices && GOOGLE_SERVICE_INFO_PLIST
      ? { googleServicesFile: GOOGLE_SERVICE_INFO_PLIST }
      : {}),
    infoPlist: {
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#4F46E5',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    package: selected.androidPackage,
    predictiveBackGestureEnabled: false,
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'POST_NOTIFICATIONS',
    ],
    ...(hasAndroidGoogleServices && GOOGLE_SERVICES_JSON
      ? { googleServicesFile: GOOGLE_SERVICES_JSON }
      : {}),
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-localization',
    [
      'expo-image-picker',
      {
        photosPermission:
          'Allow DENTA Doctor to access your photos so you can update your profile picture.',
        cameraPermission:
          'Allow DENTA Doctor to use the camera to take a profile picture.',
        microphonePermission: false,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow DENTA to use your location to show nearby dental clinics on the map.',
      },
    ],
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: GOOGLE_MAPS_API_KEY,
        iosGoogleMapsApiKey: GOOGLE_MAPS_API_KEY,
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#4F46E5',
        defaultChannel: 'default',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFFFF',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appVariant: VARIANT,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    firebaseConfigured: hasAndroidGoogleServices || hasIosGoogleServices,
    eas: {
      projectId: process.env.EAS_PROJECT_ID || undefined,
    },
  },
});
