import { router } from 'expo-router';
import { CalendarDays } from '@/components/icons';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { MobileEmpty, MobileHeader, MobileSegmented } from '@/components/mobile';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useTheme } from '@/theme';
import { AppointmentStatus } from '@/types';

const TABS: AppointmentStatus[] = ['upcoming', 'completed', 'cancelled'];

export default function AppointmentsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const [tab, setTab] = useState<AppointmentStatus>('upcoming');
  const appointments = useAppointmentsStore((s) => s.appointments);

  const filtered = useMemo(
    () => appointments.filter((a) => a.status === tab),
    [appointments, tab],
  );

  const emptyTitle =
    tab === 'upcoming'
      ? t('appointments.no_upcoming')
      : tab === 'completed'
        ? t('appointments.no_completed')
        : t('appointments.no_cancelled');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg }}>
        <MobileHeader title={t('tabs.appointments')} />
        <MobileSegmented
          value={tab}
          onChange={setTab}
          options={TABS.map((key) => ({
            value: key,
            label: t(`appointments.${key}`),
          }))}
        />
      </View>

      {filtered.length === 0 ? (
        <MobileEmpty
          icon={CalendarDays}
          title={emptyTitle}
          actionLabel={t('appointments.empty_cta')}
          onAction={() => router.push('/(client)/(tabs)/search')}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: spacing['5xl'] }}
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onPress={() => router.push(`/(client)/appointment/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}
