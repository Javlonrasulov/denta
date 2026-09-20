/**
 * DENTA.UZ design tokens — premium medical SaaS.
 * Typography: Geologica (display/headings) + Golos Text (body/UI).
 * Golos is Cyrillic-first (Paratype); Geologica has strong Cyrillic for brand type.
 * Dark mode: clear elevation layers, not muddy navy-on-navy.
 */

export const colors = {
  light: {
    primary: '#4338CA',
    primaryMuted: '#EEF2FF',
    primaryPressed: '#3730A3',
    secondary: '#0891B2',
    secondaryMuted: '#ECFEFF',
    success: '#16A34A',
    successMuted: '#F0FDF4',
    warning: '#F59E0B',
    warningMuted: '#FFFBEB',
    error: '#EF4444',
    errorMuted: '#FEF2F2',
    info: '#2563EB',
    infoMuted: '#EFF6FF',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSoft: '#F1F5F9',
    sidebar: '#1E1B4B',
    sidebarBorder: 'rgba(255,255,255,0.08)',
    sidebarText: '#FFFFFF',
    sidebarTextMuted: '#A5B4FC',
    sidebarItem: '#EEF2FF',
    sidebarIconBg: 'rgba(255,255,255,0.08)',
    sidebarActiveBg: 'rgba(8, 145, 178, 0.22)',
    sidebarActiveAccent: '#22D3EE',
    sidebarBrandFrom: '#0891B2',
    sidebarBrandTo: '#4338CA',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    textInverse: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.45)',
    skeleton: '#E2E8F0',
    tabInactive: '#94A3B8',
    star: '#F59E0B',
    mapPin: '#4338CA',
    chartPrimary: '#4338CA',
    chartSecondary: '#0891B2',
    chartTertiary: '#6366F1',
    chartMuted: '#CBD5E1',
    navActive: '#EEF2FF',
    navActiveText: '#4338CA',
    accentGlow: 'rgba(8, 145, 178, 0.12)',
  },
  dark: {
    primary: '#818CF8',
    primaryMuted: '#1E1B4B',
    primaryPressed: '#A5B4FC',
    secondary: '#22D3EE',
    secondaryMuted: '#083344',
    success: '#4ADE80',
    successMuted: '#14532D',
    warning: '#FBBF24',
    warningMuted: '#422006',
    error: '#FB7185',
    errorMuted: '#4C0519',
    info: '#60A5FA',
    infoMuted: '#1E3A5F',
    background: '#0B1120',
    surface: '#111827',
    surfaceElevated: '#1F2937',
    surfaceSoft: '#1E293B',
    sidebar: '#0B1120',
    sidebarBorder: 'rgba(255,255,255,0.08)',
    sidebarText: '#FFFFFF',
    sidebarTextMuted: '#A5B4FC',
    sidebarItem: '#E0E7FF',
    sidebarIconBg: 'rgba(255,255,255,0.07)',
    sidebarActiveBg: 'rgba(34, 211, 238, 0.16)',
    sidebarActiveAccent: '#22D3EE',
    sidebarBrandFrom: '#22D3EE',
    sidebarBrandTo: '#818CF8',
    border: '#334155',
    borderSubtle: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    textInverse: '#0B1120',
    overlay: 'rgba(0, 0, 0, 0.6)',
    skeleton: '#1E293B',
    tabInactive: '#64748B',
    star: '#FBBF24',
    mapPin: '#818CF8',
    chartPrimary: '#818CF8',
    chartSecondary: '#22D3EE',
    chartTertiary: '#A5B4FC',
    chartMuted: '#475569',
    navActive: '#1E1B4B',
    navActiveText: '#818CF8',
    accentGlow: 'rgba(34, 211, 238, 0.14)',
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
  lg: 14,
  xl: 18,
  '2xl': 22,
  full: 9999,
} as const;

/** Geologica = brand/display; Golos Text = Cyrillic-first UI body */
export const typography = {
  display: { fontSize: 34, lineHeight: 42, fontFamily: 'Geologica_700Bold', letterSpacing: -0.6 },
  h1: { fontSize: 26, lineHeight: 34, fontFamily: 'Geologica_700Bold', letterSpacing: -0.4 },
  h2: { fontSize: 20, lineHeight: 28, fontFamily: 'Geologica_600SemiBold', letterSpacing: -0.25 },
  h3: { fontSize: 16, lineHeight: 24, fontFamily: 'Geologica_600SemiBold', letterSpacing: -0.15 },
  bodyLarge: { fontSize: 16, lineHeight: 25, fontFamily: 'GolosText_400Regular', letterSpacing: 0 },
  body: { fontSize: 14, lineHeight: 22, fontFamily: 'GolosText_400Regular', letterSpacing: 0 },
  bodySmall: { fontSize: 13, lineHeight: 19, fontFamily: 'GolosText_400Regular', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: 'GolosText_500Medium', letterSpacing: 0.2 },
  label: { fontSize: 13, lineHeight: 18, fontFamily: 'GolosText_600SemiBold', letterSpacing: 0.05 },
  kpi: { fontSize: 24, lineHeight: 30, fontFamily: 'Geologica_700Bold', letterSpacing: -0.45 },
} as const;

export const fontWeight = {
  regular: 'GolosText_400Regular',
  medium: 'GolosText_500Medium',
  semibold: 'GolosText_600SemiBold',
  bold: 'Geologica_700Bold',
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
    shadowColor: '#0A0F1A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0A0F1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0A0F1A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;

/** Dark mode needs stronger shadows for depth against near-black bg */
export const shadowsDark = {
  none: shadows.none,
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 8,
  },
} as const;

export const elevation = {
  flat: 0,
  raised: 1,
  floating: 3,
  modal: 8,
} as const;

export const animation = {
  fast: 120,
  normal: 200,
  slow: 320,
  spring: { damping: 20, stiffness: 220, mass: 0.7 },
} as const;

export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

export const buttonSizes = {
  sm: { height: 36, paddingHorizontal: 12, fontSize: 13 },
  md: { height: 44, paddingHorizontal: 16, fontSize: 14 },
  lg: { height: 52, paddingHorizontal: 20, fontSize: 15 },
} as const;

export const inputSizes = {
  sm: { height: 36, fontSize: 13 },
  md: { height: 44, fontSize: 14 },
  lg: { height: 52, fontSize: 15 },
} as const;

export const layout = {
  sidebarWidth: 252,
  sidebarCollapsedWidth: 80,
  headerHeight: 64,
  contentMaxWidth: 1440,
  contentPadding: 24,
  contentPaddingMobile: 16,
  breakpointTablet: 768,
  breakpointDesktop: 1024,
  kpiMinWidth: 160,
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const minTouchTarget = 44;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = { [K in keyof typeof colors.light]: string };
