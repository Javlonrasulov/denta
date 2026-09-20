import { Platform } from 'react-native';

import type { ThemeColors } from '@/theme/tokens';

/**
 * Android 15+ edge-to-edge often reports insets.bottom as 0, so the
 * tab icons sit behind the 3-button / gesture navigation bar (~48dp).
 */
export function tabBarBottomInset(inset: number): number {
  const min = Platform.OS === 'android' ? 48 : 10;
  return Math.max(inset, min);
}

/** Shared tab bar — Client uses elevated floating style via clientTabBarStyle. */
export function mobileTabBarStyle(colors: ThemeColors, bottomInset: number) {
  const bottom = tabBarBottomInset(bottomInset);
  return {
    backgroundColor: colors.surface,
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    height: 52 + bottom,
    paddingBottom: bottom,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  };
}

/** Premium attached tab bar — matches the client home dashboard. */
export function clientTabBarStyle(colors: ThemeColors, bottomInset: number) {
  const bottom = tabBarBottomInset(bottomInset);
  return {
    backgroundColor: colors.surface,
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    height: 58 + bottom,
    paddingBottom: bottom,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  };
}

export const mobileTabLabelStyle = {
  fontSize: 10,
  fontWeight: '600' as const,
  letterSpacing: 0.1,
};

export function doctorTabBarStyle(
  colors: ThemeColors,
  bottomInset: number,
  isDark: boolean,
) {
  const bottom = tabBarBottomInset(bottomInset);
  return {
    backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
    borderTopColor: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.08)',
    borderTopWidth: 1,
    height: 56 + bottom,
    paddingBottom: bottom,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  };
}

export const doctorTabLabelStyle = {
  fontSize: 11,
  fontWeight: '600' as const,
  letterSpacing: 0.05,
  includeFontPadding: false,
};
