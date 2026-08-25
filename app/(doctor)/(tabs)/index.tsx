import { router } from 'expo-router';
import { CalendarPlus, Clock, UserPlus, Users, Wallet, CheckCircle2, CalendarDays } from '@/components/icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { KpiStat, QuickActions, Section, Timeline } from '@/components/crm';
import { Text } from '@/components/ui/Text';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useAppointments, useDoctorStats } from '@/hooks/queries';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function DoctorDashboardScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const stats = useDoctorStats();
  const appointments = useAppointments('upcoming');

  const today = (appointments.data ?? [])
    .filter((a) => a.date === '2026-08-23')
    .sort((a, b) => a.time.localeCompare(b.time));

  if (stats.isLoading) return <ListSkeleton rows={6} />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing['5xl'],
        gap: spacing.lg,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text variant="h1">{t('tabs.dashboard')}</Text>
        <Text variant="body" color={colors.textSecondary}>
          {t('doctor_app.todays_appointments')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <KpiStat
          label={t('doctor_app.todays_patients')}
          value={String(stats.data?.patients ?? 0)}
          icon={Users}
        />
        <KpiStat
          label={t('doctor_app.completed')}
          value={String(stats.data?.completed ?? 0)}
          icon={CheckCircle2}
        />
        <KpiStat
          label={t('doctor_app.upcoming')}
          value={String(stats.data?.upcoming ?? 0)}
          icon={CalendarDays}
        />
        <KpiStat
          label={t('doctor_app.todays_income')}
          value={formatPrice(stats.data?.income ?? 0)}
          icon={Wallet}
        />
      </View>

      <QuickActions
        actions={[
          { id: 'p', label: t('doctor_app.add_patient'), icon: UserPlus },
          { id: 'a', label: t('doctor_app.add_appointment'), icon: CalendarPlus },
          { id: 's', label: t('doctor_app.manage_schedule'), icon: Clock },
        ]}
      />

      <Section title={t('doctor_app.todays_appointments')}>
        {today.length === 0 ? (
          <Text muted>{t('appointments.no_upcoming')}</Text>
        ) : (
          <Timeline
            items={today.map((apt) => ({
              id: apt.id,
              time: apt.time,
              title: apt.patientName,
              subtitle: apt.serviceName,
              status: t('appointments.status_upcoming'),
              statusTone: 'primary' as const,
            }))}
            onPressItem={(item) => router.push(`/(doctor)/patient/${item.id.replace('apt-', 'patient-')}`)}
          />
        )}
      </Section>
    </ScrollView>
  );
}
