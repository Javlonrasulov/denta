import { useTheme } from '@/theme';

export function useLoginTheme() {
  const theme = useTheme();
  const { isDark } = theme;

  return {
    ...theme,
    canvas: isDark ? '#0B1220' : '#E3E9F4',
    canvasMid: isDark ? '#101828' : '#EDF1F8',
    authSurface: isDark ? '#151D2E' : '#F4F6FB',
    field: isDark ? '#1B2436' : '#E7ECF5',
    fieldFocus: isDark ? '#222C42' : '#FFFFFF',
    hairline: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.1)',
    dental: isDark ? 'rgba(165, 180, 252, 0.16)' : 'rgba(67, 56, 202, 0.14)',
    dentalSoft: isDark ? 'rgba(165, 180, 252, 0.08)' : 'rgba(67, 56, 202, 0.07)',
    glow: isDark ? 'rgba(67, 56, 202, 0.24)' : 'rgba(67, 56, 202, 0.12)',
    cta: isDark ? (['#4F46E5', '#4338CA'] as const) : (['#4338CA', '#3730A3'] as const),
    ctaText: '#FFFFFF',
  };
}
