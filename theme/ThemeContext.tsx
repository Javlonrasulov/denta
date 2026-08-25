import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme as useSystemScheme } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';
import {
  animation,
  buttonSizes,
  colors,
  elevation,
  fontWeight,
  hitSlop,
  iconSizes,
  inputSizes,
  minTouchTarget,
  radius,
  shadows,
  spacing,
  ThemeColors,
  typography,
} from './tokens';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  fontWeight: typeof fontWeight;
  shadows: typeof shadows;
  elevation: typeof elevation;
  animation: typeof animation;
  iconSizes: typeof iconSizes;
  buttonSizes: typeof buttonSizes;
  inputSizes: typeof inputSizes;
  hitSlop: typeof hitSlop;
  minTouchTarget: typeof minTouchTarget;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const system = useSystemScheme();
  const isDark = themeMode === 'system' ? system === 'dark' : themeMode === 'dark';

  const value = useMemo<ThemeValue>(
    () => ({
      mode: themeMode,
      isDark,
      colors: isDark ? colors.dark : colors.light,
      spacing,
      radius,
      typography,
      fontWeight,
      shadows,
      elevation,
      animation,
      iconSizes,
      buttonSizes,
      inputSizes,
      hitSlop,
      minTouchTarget,
    }),
    [themeMode, isDark],
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
