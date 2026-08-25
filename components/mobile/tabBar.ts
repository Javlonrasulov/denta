import type { ThemeColors } from '@/theme/tokens';

/** Shared premium tab bar chrome for Client + Doctor. */
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

export const mobileTabLabelStyle = {
  fontSize: 10,
  fontWeight: '600' as const,
  letterSpacing: 0.1,
};
