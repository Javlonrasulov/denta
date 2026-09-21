import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FavoriteClinicCard,
  FavoriteDoctorCard,
  FavoritesEmptyState,
  FavoritesErrorState,
  FavoritesHeader,
  FavoritesSegmented,
  FavoritesSkeleton,
  FavoritesUndoBar,
  type FavoritesTab,
} from '@/components/client/favorites';
import { nextSlotHint } from '@/components/client/search/searchUtils';
import { tabBarBottomInset } from '@/components/mobile';
import { useClinics, useDoctors } from '@/hooks/queries';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import type { Clinic, Doctor } from '@/types';

const UNDO_MS = 4800;

type PendingRemoval = { kind: FavoritesTab; id: string };

function earliestClinicSlot(clinicId: string, doctors: Doctor[]) {
  const hints = doctors
    .filter((doctor) => doctor.clinicId === clinicId)
    .map(nextSlotHint);
  if (!hints.length) return null;
  hints.sort((a, b) => {
    if (a.day !== b.day) return a.day === 'today' ? -1 : 1;
    return a.time.localeCompare(b.time);
  });
  return hints[0];
}

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const [tab, setTab] = useState<FavoritesTab>('clinics');
  const [pending, setPending] = useState<PendingRemoval | null>(null);
  const pendingRef = useRef<PendingRemoval | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clinicIds = useFavoritesStore((s) => s.clinicIds);
  const doctorIds = useFavoritesStore((s) => s.doctorIds);
  const hydrate = useFavoritesStore((s) => s.hydrate);
  const hydrated = useFavoritesStore((s) => s.hydrated);
  const toggleClinic = useFavoritesStore((s) => s.toggleClinic);
  const toggleDoctor = useFavoritesStore((s) => s.toggleDoctor);
  const setDraft = useAppointmentsStore((s) => s.setDraft);

  const clinicsQuery = useClinics();
  const doctorsQuery = useDoctors();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const clinicsById = useMemo(() => {
    const map = new Map<string, Clinic>();
    for (const clinic of clinicsQuery.data ?? []) map.set(clinic.id, clinic);
    return map;
  }, [clinicsQuery.data]);

  const heldClinicId =
    pendingRef.current?.kind === 'clinics' ? pendingRef.current.id : pending?.kind === 'clinics' ? pending.id : undefined;
  const heldDoctorId =
    pendingRef.current?.kind === 'doctors' ? pendingRef.current.id : pending?.kind === 'doctors' ? pending.id : undefined;

  const favClinics = useMemo(
    () =>
      (clinicsQuery.data ?? []).filter(
        (clinic) => clinicIds.includes(clinic.id) || clinic.id === heldClinicId,
      ),
    [clinicsQuery.data, clinicIds, heldClinicId],
  );

  const favDoctors = useMemo(
    () =>
      (doctorsQuery.data ?? []).filter(
        (doctor) => doctorIds.includes(doctor.id) || doctor.id === heldDoctorId,
      ),
    [doctorsQuery.data, doctorIds, heldDoctorId],
  );

  const clearPending = useCallback(() => {
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
    pendingRef.current = null;
    setPending(null);
  }, []);

  const scheduleHide = useCallback((next: PendingRemoval) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    pendingRef.current = next;
    setPending(next);
    undoTimer.current = setTimeout(() => {
      pendingRef.current = null;
      setPending(null);
      undoTimer.current = null;
    }, UNDO_MS);
  }, []);

  const onToggleClinic = useCallback(
    async (id: string) => {
      const wasFav = clinicIds.includes(id);
      if (wasFav) {
        scheduleHide({ kind: 'clinics', id });
        await toggleClinic(id);
        if (useFavoritesStore.getState().clinicIds.includes(id)) {
          clearPending();
        }
        return;
      }
      clearPending();
      await toggleClinic(id);
    },
    [clinicIds, clearPending, scheduleHide, toggleClinic],
  );

  const onToggleDoctor = useCallback(
    async (id: string) => {
      const wasFav = doctorIds.includes(id);
      if (wasFav) {
        scheduleHide({ kind: 'doctors', id });
        await toggleDoctor(id);
        if (useFavoritesStore.getState().doctorIds.includes(id)) {
          clearPending();
        }
        return;
      }
      clearPending();
      await toggleDoctor(id);
    },
    [clearPending, doctorIds, scheduleHide, toggleDoctor],
  );

  const onUndo = useCallback(() => {
    if (!pending) return;
    const { kind, id } = pending;
    clearPending();
    if (kind === 'clinics') void toggleClinic(id);
    else void toggleDoctor(id);
  }, [clearPending, pending, toggleClinic, toggleDoctor]);

  const openClinic = (id: string) => router.push(`/(client)/clinic/${id}`);
  const openDoctor = (id: string) => router.push(`/(client)/doctor/${id}`);
  const bookClinic = (clinic: Clinic) => {
    setDraft({ clinicId: clinic.id });
    router.push({ pathname: '/(client)/booking', params: { clinicId: clinic.id } });
  };
  const bookDoctor = (doctor: Doctor) => {
    setDraft({ clinicId: doctor.clinicId, doctorId: doctor.id });
    router.push(`/(client)/doctor/${doctor.id}`);
  };
  const openMap = (clinicId?: string) => {
    if (clinicId) {
      router.push({ pathname: '/(client)/map', params: { clinicId } });
      return;
    }
    router.push('/(client)/map');
  };
  const findClinics = () =>
    router.push({ pathname: '/(client)/(tabs)/search', params: { tab: 'clinics' } });
  const findDoctors = () =>
    router.push({ pathname: '/(client)/(tabs)/search', params: { tab: 'doctors' } });

  const clinicCount = clinicIds.length;
  const doctorCount = doctorIds.length;

  const isLoading =
    !hydrated ||
    (tab === 'clinics'
      ? clinicIds.length > 0 && clinicsQuery.isLoading
      : doctorIds.length > 0 && doctorsQuery.isLoading);
  const isError =
    tab === 'clinics'
      ? clinicIds.length > 0 && clinicsQuery.isError
      : doctorIds.length > 0 && doctorsQuery.isError;
  const retry = () => {
    void hydrate();
    void clinicsQuery.refetch();
    void doctorsQuery.refetch();
  };

  const listPad = 56 + 64 + tabBarBottomInset(insets.bottom) + (pending ? 56 : 0);
  const data = tab === 'clinics' ? favClinics : favDoctors;

  const listHeader = (
    <View style={{ paddingTop: spacing.md, paddingBottom: spacing.md, gap: 14 }}>
      <FavoritesHeader clinicCount={clinicCount} doctorCount={doctorCount} />
      <FavoritesSegmented
        value={tab}
        onChange={setTab}
        counts={{ clinics: clinicCount, doctors: doctorCount }}
      />
    </View>
  );

  const listEmpty = isError ? (
    <FavoritesErrorState onRetry={retry} />
  ) : isLoading ? (
    <FavoritesSkeleton tab={tab} />
  ) : (
    <FavoritesEmptyState
      tab={tab}
      onPrimary={tab === 'clinics' ? findClinics : findDoctors}
      onSecondary={tab === 'clinics' ? () => openMap() : undefined}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {tab === 'clinics' ? (
        <FlatList
          data={isLoading || isError ? [] : (data as Clinic[])}
          keyExtractor={(item) => item.id}
          key="fav-clinics"
          extraData={`${clinicIds.join('|')}:${pending?.id ?? ''}`}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          refreshControl={
            <RefreshControl
              refreshing={clinicsQuery.isFetching && !clinicsQuery.isLoading}
              onRefresh={() => {
                void hydrate();
                void clinicsQuery.refetch();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            gap: 14,
            paddingBottom: listPad,
            flexGrow: 1,
          }}
          renderItem={({ item }) => (
            <FavoriteClinicCard
              clinic={item}
              isFavorite={clinicIds.includes(item.id)}
              pendingRemoval={pending?.kind === 'clinics' && pending.id === item.id}
              nextSlot={earliestClinicSlot(item.id, doctorsQuery.data ?? [])}
              onPress={() => openClinic(item.id)}
              onDetails={() => openClinic(item.id)}
              onBook={() => bookClinic(item)}
              onMap={() => openMap(item.id)}
              onToggleFavorite={() => void onToggleClinic(item.id)}
            />
          )}
        />
      ) : (
        <FlatList
          data={isLoading || isError ? [] : (data as Doctor[])}
          keyExtractor={(item) => item.id}
          key="fav-doctors"
          extraData={`${doctorIds.join('|')}:${pending?.id ?? ''}`}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          refreshControl={
            <RefreshControl
              refreshing={doctorsQuery.isFetching && !doctorsQuery.isLoading}
              onRefresh={() => {
                void hydrate();
                void doctorsQuery.refetch();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            gap: 12,
            paddingBottom: listPad,
            flexGrow: 1,
          }}
          renderItem={({ item }) => (
            <FavoriteDoctorCard
              doctor={item}
              clinic={clinicsById.get(item.clinicId)}
              isFavorite={doctorIds.includes(item.id)}
              pendingRemoval={pending?.kind === 'doctors' && pending.id === item.id}
              nextSlot={nextSlotHint(item)}
              onPress={() => openDoctor(item.id)}
              onProfile={() => openDoctor(item.id)}
              onBook={() => bookDoctor(item)}
              onToggleFavorite={() => void onToggleDoctor(item.id)}
            />
          )}
        />
      )}

      <View
        pointerEvents="box-none"
        collapsable={false}
        style={{
          position: 'absolute',
          left: spacing.xl,
          right: spacing.xl,
          bottom: 12,
          zIndex: 40,
          elevation: 20,
        }}
      >
        <FavoritesUndoBar visible={Boolean(pending)} onUndo={onUndo} />
      </View>
    </View>
  );
}
