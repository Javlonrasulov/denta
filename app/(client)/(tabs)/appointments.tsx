import { router } from 'expo-router';
import { CalendarDays } from '@/components/icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { EmptyState } from '@/components/states/EmptyState';
import { Text } from '@/components/ui/Text';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useTheme } from '@/theme';
import { AppointmentStatus } from '@/types';

const TABS: AppointmentStatus[] = ['upcoming', 'completed', 'cancelled'];

export default function AppointmentsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
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
        <Text variant="h1">{t('tabs.appointments')}</Text>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surfaceSoft,
            borderRadius: radius.lg,
            padding: 4,
          }}
        >
          {TABS.map((key) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={{
                flex: 1,
                paddingVertical: spacing.sm + 2,
                borderRadius: radius.md,
                backgroundColor: tab === key ? colors.surface : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text
                variant="label"
                color={tab === key ? colors.primary : colors.textMuted}
              >
                {t(`appointments.${key}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={emptyTitle}
          actionLabel={t('appointments.empty_cta')}
          onAction={() => router.push('/(client)/(tabs)/search')}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
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
