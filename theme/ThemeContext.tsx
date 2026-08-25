import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Platform, useColorScheme as useSystemScheme, useWindowDimensions } from 'react-native';

import { useSettingsStore, type UiFontSize } from '@/store/settingsStore';
import {
  animation,
  buttonSizes,
  colors,
  elevation,
  fontWeight,
  hitSlop,
  iconSizes,
  inputSizes,
  layout,
  minTouchTarget,
  radius,
  shadows,
  shadowsDark,
  spacing,
  ThemeColors,
  typography,
} from './tokens';

type ThemeMode = 'light' | 'dark' | 'system';

/** Matches LiderPlast html root sizes: 13 / 15 / 17 / 19 */
const FONT_SCALE: Record<UiFontSize, number> = {
  sm: 13 / 15,
  md: 1,
  lg: 17 / 15,
  xl: 19 / 15,
};

const WEB_ROOT_FONT: Record<UiFontSize, string> = {
  sm: '13px',
  md: '15px',
  lg: '17px',
  xl: '19px',
};

type TypographyTokens = {
  [K in keyof typeof typography]: {
    fontSize: number;
    lineHeight: number;
    fontFamily: string;
    letterSpacing: number;
  };
};

function scaleTypography(scale: number): TypographyTokens {
  const next = {} as TypographyTokens;
  (Object.keys(typography) as (keyof typeof typography)[]).forEach((key) => {
    const token = typography[key];
    next[key] = {
      ...token,
      fontSize: Math.round(token.fontSize * scale),
      lineHeight: Math.round(token.lineHeight * scale),
    };
  });
  return next;
}

interface ThemeValue {
  mode: ThemeMode;
  fontSize: UiFontSize;
  isDark: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: TypographyTokens;
  fontWeight: typeof fontWeight;
  shadows: typeof shadows | typeof shadowsDark;
  elevation: typeof elevation;
  animation: typeof animation;
  iconSizes: typeof iconSizes;
  buttonSizes: typeof buttonSizes;
  inputSizes: typeof inputSizes;
  layout: typeof layout;
  hitSlop: typeof hitSlop;
  minTouchTarget: typeof minTouchTarget;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const system = useSystemScheme();
  const { width } = useWindowDimensions();
  const isDark = themeMode === 'system' ? system === 'dark' : themeMode === 'dark';
  const isDesktop = width >= layout.breakpointDesktop;
  const isTablet = width >= layout.breakpointTablet && width < layout.breakpointDesktop;
  const scale = FONT_SCALE[fontSize] ?? 1;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.style.fontSize = WEB_ROOT_FONT[fontSize] ?? WEB_ROOT_FONT.md;
  }, [fontSize]);

  const value = useMemo<ThemeValue>(
    () => ({
      mode: themeMode,
      fontSize,
      isDark,
      isDesktop,
      isTablet,
      colors: isDark ? colors.dark : colors.light,
      spacing,
      radius,
      typography: scaleTypography(scale),
      fontWeight,
      shadows: isDark ? shadowsDark : shadows,
      elevation,
      animation,
      iconSizes,
      buttonSizes,
      inputSizes,
      layout,
      hitSlop,
      minTouchTarget,
    }),
    [themeMode, fontSize, isDark, isDesktop, isTablet, scale],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
