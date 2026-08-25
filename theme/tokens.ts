/**
 * DENTA.UZ design tokens — premium medical SaaS.
 * Typography: Geologica (display/headings) + Golos Text (body/UI).
 * Golos is Cyrillic-first (Paratype); Geologica has strong Cyrillic for brand type.
 * Dark mode: clear elevation layers, not muddy navy-on-navy.
 */

export const colors = {
  light: {
    primary: '#0B3A6E',
    primaryMuted: '#E6F0FA',
    primaryPressed: '#082B52',
    secondary: '#0F9B8E',
    secondaryMuted: '#E0F7F4',
    success: '#0D9F6E',
    successMuted: '#E6FBF3',
    warning: '#D97706',
    warningMuted: '#FFF7E8',
    error: '#E11D48',
    errorMuted: '#FFF1F3',
    info: '#2563EB',
    infoMuted: '#EFF6FF',
    background: '#F3F5F9',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSoft: '#EBEEF5',
    sidebar: '#0A2540',
    sidebarBorder: 'rgba(255,255,255,0.08)',
    sidebarText: '#FFFFFF',
    sidebarTextMuted: '#A8BACC',
    sidebarItem: '#E8F0F8',
    sidebarIconBg: 'rgba(255,255,255,0.08)',
    sidebarActiveBg: 'rgba(15, 155, 142, 0.22)',
    sidebarActiveAccent: '#2DD4BF',
    sidebarBrandFrom: '#0F9B8E',
    sidebarBrandTo: '#0B6E9B',
    border: '#D8DEE8',
    borderSubtle: '#EAEFF5',
    text: '#0A0F1A',
    textSecondary: '#3D4A5C',
    textMuted: '#8490A3',
    textInverse: '#FFFFFF',
    overlay: 'rgba(10, 15, 26, 0.45)',
    skeleton: '#E2E7EF',
    tabInactive: '#8490A3',
    star: '#F59E0B',
    mapPin: '#0B3A6E',
    chartPrimary: '#0B3A6E',
    chartSecondary: '#0F9B8E',
    chartTertiary: '#6366F1',
    chartMuted: '#C5CDDA',
    navActive: '#E6F0FA',
    navActiveText: '#0B3A6E',
    accentGlow: 'rgba(15, 155, 142, 0.12)',
  },
  dark: {
    // Brighter accents + clearer surface steps (not muddy)
    primary: '#7EB8FF',
    primaryMuted: '#1A2F4A',
    primaryPressed: '#A3CCFF',
    secondary: '#2EE6D0',
    secondaryMuted: '#0F3D3A',
    success: '#3DDC97',
    successMuted: '#0F3D2C',
    warning: '#FBBF24',
    warningMuted: '#3D2E0A',
    error: '#FB7185',
    errorMuted: '#3F1520',
    info: '#74A9FF',
    infoMuted: '#1A2F4A',
    background: '#0A0C10',
    surface: '#151922',
    surfaceElevated: '#1C2230',
    surfaceSoft: '#222938',
    sidebar: '#0B0F16',
    sidebarBorder: 'rgba(255,255,255,0.08)',
    sidebarText: '#FFFFFF',
    sidebarTextMuted: '#A0ADC2',
    sidebarItem: '#E6ECF5',
    sidebarIconBg: 'rgba(255,255,255,0.07)',
    sidebarActiveBg: 'rgba(46, 230, 208, 0.16)',
    sidebarActiveAccent: '#2EE6D0',
    sidebarBrandFrom: '#2EE6D0',
    sidebarBrandTo: '#4A9EFF',
    border: '#323A4D',
    borderSubtle: '#252B3A',
    text: '#F5F7FB',
    textSecondary: '#B4BECF',
    textMuted: '#7D889C',
    textInverse: '#0A0C10',
    overlay: 'rgba(0, 0, 0, 0.6)',
    skeleton: '#222938',
    tabInactive: '#7D889C',
    star: '#FBBF24',
    mapPin: '#7EB8FF',
    chartPrimary: '#7EB8FF',
    chartSecondary: '#2EE6D0',
    chartTertiary: '#A5B4FC',
    chartMuted: '#3A4256',
    navActive: '#1A2F4A',
    navActiveText: '#7EB8FF',
    accentGlow: 'rgba(46, 230, 208, 0.14)',
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
  sidebarWidth: 268,
  sidebarCollapsedWidth: 76,
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
