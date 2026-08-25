import { router } from 'expo-router';
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  UserPlus,
  Users,
  Wallet,
} from '@/components/icons';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  MobileCard,
  MobileEmpty,
  MobileHeader,
  MobileQuickActions,
  MobileScreen,
  MobileSection,
  MobileStatRow,
} from '@/components/mobile';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppointments, useDoctorStats } from '@/hooks/queries';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function DoctorDashboardScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const stats = useDoctorStats();
  const appointments = useAppointments('upcoming');

  const today = (appointments.data ?? [])
    .filter((a) => a.date === '2026-08-23')
    .sort((a, b) => a.time.localeCompare(b.time));

  if (stats.isLoading) return <ListSkeleton rows={6} />;

  return (
    <MobileScreen contentStyle={{ gap: spacing.xl }}>
      <MobileHeader
        large
        title={t('tabs.dashboard')}
        subtitle={t('doctor_app.todays_appointments')}
      />

      <MobileStatRow
        stats={[
          {
            id: 'patients',
            label: t('doctor_app.todays_patients'),
            value: String(stats.data?.patients ?? 0),
            icon: Users,
          },
          {
            id: 'completed',
            label: t('doctor_app.completed'),
            value: String(stats.data?.completed ?? 0),
            icon: CheckCircle2,
          },
          {
            id: 'upcoming',
            label: t('doctor_app.upcoming'),
            value: String(stats.data?.upcoming ?? 0),
            icon: CalendarDays,
          },
          {
            id: 'income',
            label: t('doctor_app.todays_income'),
            value: formatPrice(stats.data?.income ?? 0),
            icon: Wallet,
          },
        ]}
      />

      <MobileQuickActions
        actions={[
          { id: 'p', label: t('doctor_app.add_patient'), icon: UserPlus, onPress: () => undefined },
          {
            id: 'a',
            label: t('doctor_app.add_appointment'),
            icon: CalendarPlus,
            onPress: () => undefined,
          },
          {
            id: 's',
            label: t('doctor_app.manage_schedule'),
            icon: Clock,
            onPress: () => undefined,
          },
        ]}
      />

      <MobileSection title={t('doctor_app.todays_appointments')} style={{ marginBottom: 0 }}>
        {today.length === 0 ? (
          <MobileEmpty icon={CalendarDays} title={t('appointments.no_upcoming')} />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {today.map((apt) => (
              <MobileCard
                key={apt.id}
                onPress={() =>
                  router.push(`/(doctor)/patient/${apt.id.replace('apt-', 'patient-')}`)
                }
              >
                <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
                  <Text variant="label" color={colors.primary} style={{ minWidth: 48 }}>
                    {apt.time}
                  </Text>
                  <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                    <Text variant="label" numberOfLines={1}>
                      {apt.patientName}
                    </Text>
                    <Text variant="caption" muted numberOfLines={1}>
                      {apt.serviceName}
                    </Text>
                  </View>
                  <Text variant="caption" color={colors.primary}>
                    {t('appointments.status_upcoming')}
                  </Text>
                </View>
              </MobileCard>
            ))}
          </View>
        )}
      </MobileSection>
    </MobileScreen>
  );
}
