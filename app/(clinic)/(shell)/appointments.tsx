import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppShell } from '@/components/layout/AppShell';
import { SegmentedControl, Section, Timeline } from '@/components/crm';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useAppointments } from '@/hooks/queries';
import { useTheme } from '@/theme';

export default function ClinicAppointmentsScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [mode, setMode] = useState<'day' | 'week' | 'month'>('day');
  const appointments = useAppointments();

  const items = useMemo(() => {
    return [...(appointments.data ?? [])]
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, mode === 'day' ? 12 : mode === 'week' ? 20 : 30)
      .map((a) => ({
        id: a.id,
        time: a.time,
        title: a.patientName,
        subtitle: `${a.serviceName} · ${a.doctorName}`,
        meta: a.date,
        status:
          a.status === 'upcoming'
            ? t('appointments.status_upcoming')
            : a.status === 'completed'
              ? t('appointments.status_completed')
              : t('appointments.status_cancelled'),
        statusTone:
          a.status === 'upcoming'
            ? ('primary' as const)
            : a.status === 'completed'
              ? ('success' as const)
              : ('error' as const),
      }));
  }, [appointments.data, mode, t]);

  return (
    <AppShell title={t('crm.appointments.title')} subtitle={t('crm.appointments.subtitle')}>
      <View style={{ gap: spacing.lg }}>
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: 'day', label: t('crm.appointments.day') },
            { value: 'week', label: t('crm.appointments.week') },
            { value: 'month', label: t('crm.appointments.month') },
          ]}
        />
        {appointments.isLoading ? (
          <ListSkeleton rows={6} />
        ) : (
          <Section title={t('crm.dashboard.todays_schedule')}>
            <Timeline items={items} />
          </Section>
        )}
      </View>
    </AppShell>
  );
}
