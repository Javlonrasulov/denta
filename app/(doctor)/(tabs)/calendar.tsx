import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  MobileCard,
  MobileHeader,
  MobileScreen,
  MobileSection,
  MobileSegmented,
} from '@/components/mobile';
import { Text } from '@/components/ui/Text';
import { useAppointments } from '@/hooks/queries';
import { useTheme } from '@/theme';

type Mode = 'day' | 'week' | 'month';

export default function DoctorCalendarScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const [mode, setMode] = useState<Mode>('day');
  const appointments = useAppointments('upcoming');

  return (
    <MobileScreen contentStyle={{ gap: spacing.xl }}>
      <MobileHeader title={t('tabs.calendar')} />

      <MobileSegmented
        value={mode}
        onChange={setMode}
        options={(['day', 'week', 'month'] as const).map((key) => ({
          value: key,
          label: t(`doctor_app.${key}`),
        }))}
      />

      <MobileCard>
        <View style={{ gap: spacing.sm }}>
          <Text variant="h3">{t('doctor_app.working_hours')}</Text>
          <Text variant="body">09:00 – 18:00</Text>
          <Text variant="bodySmall" muted>
            {t('doctor_app.break_time')}: 13:00 – 14:00
          </Text>
          <Text variant="bodySmall" muted>
            {t('doctor_app.appointment_duration')}: 30 {t('common.minutes')}
          </Text>
        </View>
      </MobileCard>

      <MobileSection title={t('doctor_app.todays_appointments')} style={{ marginBottom: 0 }}>
        <View style={{ gap: spacing.sm }}>
          {(appointments.data ?? []).slice(0, 8).map((apt) => (
            <MobileCard key={apt.id}>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
                <Text variant="label" color={colors.primary} style={{ minWidth: 48 }}>
                  {apt.time}
                </Text>
                <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                  <Text variant="label" numberOfLines={1}>
                    {apt.patientName}
                  </Text>
                  <Text variant="caption" muted numberOfLines={1}>
                    {apt.date} · {apt.serviceName}
                  </Text>
                </View>
              </View>
            </MobileCard>
          ))}
        </View>
      </MobileSection>
    </MobileScreen>
  );
}
