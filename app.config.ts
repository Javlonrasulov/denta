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
      backgroundColor: '#153E75',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    package: selected.androidPackage,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-localization',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#153E75',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appVariant: VARIANT,
    eas: {
      projectId: undefined,
    },
  },
});
