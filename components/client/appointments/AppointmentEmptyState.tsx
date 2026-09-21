import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { CalendarDays, CalendarX, CheckCircle2 } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import type { AppointmentStatus } from '@/types';

type Props = {
  tab: AppointmentStatus;
  onPrimary: () => void;
  onSecondary?: () => void;
};

export function AppointmentEmptyState({ tab, onPrimary, onSecondary }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows, isDark } = useTheme();

  const config =
    tab === 'upcoming'
      ? {
          Icon: CalendarDays,
          title: t('appointments.empty_upcoming_title'),
          subtitle: t('appointments.empty_upcoming_subtitle'),
          gradient: isDark
            ? (['rgba(129,140,248,0.3)', 'rgba(34,211,238,0.14)'] as const)
            : (['#EEF2FF', '#ECFEFF'] as const),
          iconColor: colors.primary,
          showSecondary: true,
        }
      : tab === 'completed'
        ? {
            Icon: CheckCircle2,
            title: t('appointments.empty_completed_title'),
            subtitle: t('appointments.empty_completed_subtitle'),
            gradient: isDark
              ? (['rgba(74,222,128,0.22)', 'rgba(34,211,238,0.1)'] as const)
              : (['#F0FDF4', '#ECFEFF'] as const),
            iconColor: colors.success,
            showSecondary: false,
          }
        : {
            Icon: CalendarX,
            title: t('appointments.empty_cancelled_title'),
            subtitle: t('appointments.empty_cancelled_subtitle'),
            gradient: isDark
              ? (['rgba(251,113,133,0.18)', 'rgba(148,163,184,0.12)'] as const)
              : (['#FFF1F2', '#F8FAFC'] as const),
            iconColor: isDark ? colors.error : '#E11D48',
            showSecondary: true,
          };

  const Icon = config.Icon;

  return (
    <View
      style={{
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['2xl'],
        paddingBottom: spacing.xl,
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <View
        style={[
          shadows.md,
          {
            width: '100%',
            maxWidth: 380,
            borderRadius: radius['2xl'],
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            paddingHorizontal: spacing['2xl'],
            paddingVertical: spacing['3xl'],
            alignItems: 'center',
            gap: spacing.md,
          },
        ]}
      >
        <LinearGradient
          colors={[...config.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 88,
            height: 88,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.sm,
          }}
        >
          <Icon size={36} color={config.iconColor} strokeWidth={1.7} />
        </LinearGradient>

        <Text variant="h2" center style={{ fontSize: 20 }}>
          {config.title}
        </Text>
        <Text
          variant="bodySmall"
          muted
          center
          style={{ maxWidth: 280, lineHeight: 20 }}
        >
          {config.subtitle}
        </Text>

        <View style={{ width: '100%', gap: spacing.sm, marginTop: spacing.md }}>
          <Button
            title={t('appointments.empty_cta')}
            onPress={onPrimary}
            fullWidth
            size="lg"
          />
          {config.showSecondary && onSecondary ? (
            <Button
              title={t('appointments.empty_cta_secondary')}
              onPress={onSecondary}
              variant="outline"
              fullWidth
              size="md"
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
