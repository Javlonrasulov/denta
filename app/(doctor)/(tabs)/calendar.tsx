import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { useAppointments } from '@/hooks/queries';
import { useTheme } from '@/theme';

type Mode = 'day' | 'week' | 'month';

export default function DoctorCalendarScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const [mode, setMode] = useState<Mode>('day');
  const appointments = useAppointments('upcoming');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing['5xl'],
        gap: spacing.xl,
      }}
    >
      <Text variant="h1">{t('tabs.calendar')}</Text>

      <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceSoft, borderRadius: radius.lg, padding: 4 }}>
        {(['day', 'week', 'month'] as const).map((key) => (
          <Pressable
            key={key}
            onPress={() => setMode(key)}
            style={{
              flex: 1,
              paddingVertical: spacing.sm + 2,
              borderRadius: radius.md,
              backgroundColor: mode === key ? colors.surface : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text variant="label" color={mode === key ? colors.primary : colors.textMuted}>
              {t(`doctor_app.${key}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          gap: spacing.md,
        }}
      >
        <Text variant="h3">{t('doctor_app.working_hours')}</Text>
        <Text variant="body">09:00 – 18:00</Text>
        <Text variant="bodySmall" muted>
          {t('doctor_app.break_time')}: 13:00 – 14:00
        </Text>
        <Text variant="bodySmall" muted>
          {t('doctor_app.appointment_duration')}: 30 {t('common.minutes')}
        </Text>
      </View>

      <View style={{ gap: spacing.md }}>
        {(appointments.data ?? []).slice(0, 8).map((apt) => (
          <View
            key={apt.id}
            style={{
              flexDirection: 'row',
              gap: spacing.md,
              padding: spacing.lg,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text variant="label" color={colors.primary}>
              {apt.time}
            </Text>
            <View style={{ flex: 1 }}>
              <Text variant="body">{apt.patientName}</Text>
              <Text variant="caption" muted>
                {apt.date} · {apt.serviceName}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
