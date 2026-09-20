import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import type { PatientClinicalStatus, TreatmentStatus } from '@/types';

type BadgeKind = PatientClinicalStatus | TreatmentStatus | 'service';

function toneFor(
  kind: BadgeKind,
  colors: ReturnType<typeof useLoginTheme>['colors'],
  isDark: boolean,
): { bg: string; fg: string } {
  switch (kind) {
    case 'treatment':
    case 'in_progress':
      return {
        bg: isDark ? 'rgba(129,140,248,0.16)' : 'rgba(67,56,202,0.1)',
        fg: colors.primary,
      };
    case 'completed':
      return {
        bg: isDark ? 'rgba(74,222,128,0.14)' : 'rgba(22,163,74,0.1)',
        fg: colors.success,
      };
    case 'debt':
      return {
        bg: isDark ? 'rgba(251,191,36,0.16)' : 'rgba(245,158,11,0.12)',
        fg: colors.warning,
      };
    case 'follow_up':
      return {
        bg: isDark ? 'rgba(34,211,238,0.14)' : 'rgba(8,145,178,0.1)',
        fg: colors.secondary,
      };
    case 'new':
      return {
        bg: isDark ? 'rgba(96,165,250,0.14)' : 'rgba(37,99,235,0.08)',
        fg: colors.info,
      };
    case 'planned':
      return {
        bg: isDark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.05)',
        fg: colors.textSecondary,
      };
    default:
      return {
        bg: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.04)',
        fg: colors.textMuted,
      };
  }
}

export function PatientStatusBadge({
  kind,
  label,
  treatment,
}: {
  kind: BadgeKind;
  label?: string;
  treatment?: boolean;
}) {
  const { t } = useTranslation();
  const { colors, isDark } = useLoginTheme();
  const tone = toneFor(kind, colors, isDark);
  const key =
    treatment || kind === 'planned' || kind === 'in_progress'
      ? `patients.tx_${kind === 'in_progress' ? 'in_progress' : kind}`
      : `patients.status_${kind}`;
  const text = label ?? (kind === 'service' ? '' : t(key));

  if (!text) return null;

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
        {text}
      </Text>
    </View>
  );
}
