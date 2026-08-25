/**
 * Denta design tokens — single source of truth.
 * All UI must consume these tokens (never hard-code colors/spacing).
 */

export const colors = {
  light: {
    primary: '#153E75',
    primaryMuted: '#E8F0FA',
    primaryPressed: '#0F2D56',
    secondary: '#0891B2',
    secondaryMuted: '#E0F7FA',
    success: '#059669',
    successMuted: '#ECFDF5',
    warning: '#D97706',
    warningMuted: '#FFFBEB',
    error: '#DC2626',
    errorMuted: '#FEF2F2',
    background: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSoft: '#EEF2F6',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.45)',
    skeleton: '#E2E8F0',
    tabInactive: '#94A3B8',
    star: '#F59E0B',
    mapPin: '#153E75',
  },
  dark: {
    primary: '#5B9BD5',
    primaryMuted: '#1A2A3D',
    primaryPressed: '#7AB0E0',
    secondary: '#22D3EE',
    secondaryMuted: '#0C3A42',
    success: '#34D399',
    successMuted: '#064E3B',
    warning: '#FBBF24',
    warningMuted: '#451A03',
    error: '#F87171',
    errorMuted: '#450A0A',
    background: '#0B1220',
    surface: '#141C2B',
    surfaceElevated: '#1A2436',
    surfaceSoft: '#1E293B',
    border: '#2A3548',
    borderSubtle: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverse: '#0F172A',
    overlay: 'rgba(0, 0, 0, 0.55)',
    skeleton: '#1E293B',
    tabInactive: '#64748B',
    star: '#FBBF24',
    mapPin: '#5B9BD5',
  },
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 42, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.5 },
  h1: { fontSize: 28, lineHeight: 36, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.4 },
  h2: { fontSize: 22, lineHeight: 30, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: -0.3 },
  h3: { fontSize: 18, lineHeight: 26, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: -0.2 },
  bodyLarge: { fontSize: 17, lineHeight: 26, fontFamily: 'PlusJakartaSans_400Regular', letterSpacing: 0 },
  body: { fontSize: 15, lineHeight: 22, fontFamily: 'PlusJakartaSans_400Regular', letterSpacing: 0 },
  bodySmall: { fontSize: 13, lineHeight: 18, fontFamily: 'PlusJakartaSans_400Regular', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: 'PlusJakartaSans_500Medium', letterSpacing: 0.1 },
  label: { fontSize: 13, lineHeight: 18, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.2 },
} as const;

export const fontWeight = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;

export const elevation = {
  flat: 0,
  raised: 2,
  floating: 4,
  modal: 8,
} as const;

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 18, stiffness: 180, mass: 0.8 },
} as const;

export const iconSizes = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
} as const;

export const buttonSizes = {
  sm: { height: 40, paddingHorizontal: 14, fontSize: 14 },
  md: { height: 48, paddingHorizontal: 18, fontSize: 15 },
  lg: { height: 56, paddingHorizontal: 22, fontSize: 16 },
} as const;

export const inputSizes = {
  sm: { height: 40, fontSize: 14 },
  md: { height: 48, fontSize: 15 },
  lg: { height: 56, fontSize: 16 },
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const minTouchTarget = 44;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = { [K in keyof typeof colors.light]: string };
