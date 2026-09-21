import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppointmentCard,
  AppointmentEmptyState,
  AppointmentErrorState,
  AppointmentSkeleton,
  AppointmentSummary,
  AppointmentTabs,
  AppointmentsHeader,
} from '@/components/client/appointments';
import { tabBarBottomInset } from '@/components/mobile';
import { useAppointments, useClinics } from '@/hooks/queries';
import { useRealtimeAppointments } from '@/hooks/useRealtimeAppointments';
import { useTheme } from '@/theme';
import type { AppointmentStatus } from '@/types';

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const [tab, setTab] = useState<AppointmentStatus>('upcoming');

  const query = useAppointments();
  const clinicsQuery = useClinics();
  useRealtimeAppointments();

  const allAppointments = query.data ?? [];

  const counts = useMemo(
    () => ({
      upcoming: allAppointments.filter((a) => a.status === 'upcoming').length,
      completed: allAppointments.filter((a) => a.status === 'completed').length,
      cancelled: allAppointments.filter((a) => a.status === 'cancelled').length,
    }),
    [allAppointments],
  );

  const filtered = useMemo(
    () => allAppointments.filter((a) => a.status === tab),
    [allAppointments, tab],
  );

  const clinicCoordsById = useMemo(() => {
    const map = new Map<string, { latitude: number; longitude: number }>();
    for (const clinic of clinicsQuery.data ?? []) {
      if (clinic.latitude != null && clinic.longitude != null) {
        map.set(clinic.id, {
          latitude: clinic.latitude,
          longitude: clinic.longitude,
        });
      }
    }
    return map;
  }, [clinicsQuery.data]);

  const listPad = 48 + 64 + tabBarBottomInset(insets.bottom);

  const goFindDentist = () =>
    router.push({ pathname: '/(client)/(tabs)/search', params: { tab: 'doctors' } });

  const goPopularClinics = () =>
    router.push({ pathname: '/(client)/(tabs)/search', params: { tab: 'clinics' } });

  const listHeader = (
    <View style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
      <AppointmentsHeader />
      <AppointmentSummary counts={counts} active={tab} onSelect={setTab} />
      <AppointmentTabs value={tab} onChange={setTab} counts={counts} />
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      {query.isLoading ? (
        <View style={{ flex: 1, paddingTop: spacing.md }}>
          <View
            style={{
              paddingHorizontal: spacing.xl,
              gap: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <AppointmentsHeader />
            <AppointmentSummary counts={counts} active={tab} onSelect={setTab} />
            <AppointmentTabs value={tab} onChange={setTab} counts={counts} />
          </View>
          <AppointmentSkeleton rows={3} />
        </View>
      ) : query.isError ? (
        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.md,
          }}
        >
          <View style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
            <AppointmentsHeader />
            <AppointmentSummary counts={counts} active={tab} onSelect={setTab} />
            <AppointmentTabs value={tab} onChange={setTab} counts={counts} />
          </View>
          <AppointmentErrorState onRetry={() => void query.refetch()} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
              {listHeader}
            </View>
          }
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: listPad,
            gap: spacing.md,
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isFetching && !query.isLoading}
              onRefresh={() => void query.refetch()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <AppointmentEmptyState
              tab={tab}
              onPrimary={goFindDentist}
              onSecondary={goPopularClinics}
            />
          }
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: spacing.xl }}>
              <AppointmentCard
                appointment={item}
                clinicCoords={clinicCoordsById.get(item.clinicId) ?? null}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
