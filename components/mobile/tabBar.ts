import type { ThemeColors } from '@/theme/tokens';

/** Shared tab bar — Client uses elevated floating style via clientTabBarStyle. */
export function mobileTabBarStyle(colors: ThemeColors, bottomInset: number) {
  return {
    backgroundColor: colors.surface,
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    height: 52 + Math.max(bottomInset, 8),
    paddingBottom: Math.max(bottomInset, 8),
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  };
}

/** Premium attached tab bar — matches the client home dashboard. */
export function clientTabBarStyle(colors: ThemeColors, bottomInset: number) {
  return {
    backgroundColor: colors.surface,
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    height: 58 + Math.max(bottomInset, 8),
    paddingBottom: Math.max(bottomInset, 8),
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
  return {
    backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
    borderTopColor: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.08)',
    borderTopWidth: 1,
    height: 56 + Math.max(bottomInset, 10),
    paddingBottom: Math.max(bottomInset, 10),
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
