import type { ExpoConfig, ConfigContext } from 'expo/config';

export type AppVariant = 'client' | 'doctor' | 'clinic';

const VARIANT = (process.env.APP_VARIANT ?? 'clinic') as AppVariant;

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

/** Maps SDK requires a non-empty meta-data key on Android or MapView crashes the process. */
const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY ??
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  'REPLACE_WITH_GOOGLE_MAPS_API_KEY';

export default ({ config }: ConfigContext): ExpoConfig => ({
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
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
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
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#4F46E5',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appVariant: VARIANT,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    eas: {
      projectId: undefined,
    },
  },
});
