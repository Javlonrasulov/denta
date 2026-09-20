import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import type { PaymentStatus } from '@/types';

function toneFor(
  status: PaymentStatus,
  colors: ReturnType<typeof useLoginTheme>['colors'],
  isDark: boolean,
): { bg: string; fg: string } {
  switch (status) {
    case 'paid':
      return {
        bg: isDark ? 'rgba(74,222,128,0.14)' : 'rgba(22,163,74,0.1)',
        fg: colors.success,
      };
    case 'pending':
      return {
        bg: isDark ? 'rgba(129,140,248,0.16)' : 'rgba(67,56,202,0.1)',
        fg: colors.primary,
      };
    case 'partial':
      return {
        bg: isDark ? 'rgba(34,211,238,0.14)' : 'rgba(8,145,178,0.1)',
        fg: colors.secondary,
      };
    case 'overdue':
      return {
        bg: isDark ? 'rgba(251,191,36,0.16)' : 'rgba(245,158,11,0.12)',
        fg: colors.warning,
      };
    case 'cancelled':
      return {
        bg: isDark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.06)',
        fg: colors.textMuted,
      };
    default:
      return {
        bg: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.04)',
        fg: colors.textSecondary,
      };
  }
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation();
  const { colors, isDark } = useLoginTheme();
  const tone = toneFor(status, colors, isDark);

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: tone.bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
      }}
    >
      <Text
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'GolosText_600SemiBold',
          fontSize: 11,
          lineHeight: 14,
          color: tone.fg,
          ...(Platform.OS === 'android' ? { paddingRight: 1 } : null),
        }}
      >
        {t(`doctor_finance.status_${status}`)}
      </Text>
    </View>
  );
}
