import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';

import { ArrowLeft, MapPin, Search, SlidersHorizontal } from '@/components/icons';
import {
  ClinicPreviewSheet,
  DentalMap,
  MapFilters,
  MyLocationButton,
  TASHKENT_REGION,
  filterClinicsForMap,
  type DentalMapHandle,
  type MapFilterId,
} from '@/components/map';
import { Text } from '@/components/ui/Text';
import { useClinics } from '@/hooks/queries';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';

export default function FullMapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows, isDark } = useTheme();
  const { data: clinics = [], isLoading } = useClinics();
  const favoriteClinicIds = useFavoritesStore((s) => s.clinicIds);
  const toggleClinicFavorite = useFavoritesStore((s) => s.toggleClinic);

  const mapRef = useRef<DentalMapHandle>(null);
  const sheetRef = useRef<BottomSheet>(null);

  const [activeFilters, setActiveFilters] = useState<MapFilterId[]>(['nearby']);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const filtered = useMemo(
    () => filterClinicsForMap(clinics, activeFilters),
    [clinics, activeFilters],
  );

  const selectedClinic = useMemo(
    () => clinics.find((c) => c.id === selectedId) ?? null,
    [clinics, selectedId],
  );

  useEffect(() => {
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) return;
        const last = await Location.getLastKnownPositionAsync();
        if (last) {
          setUserLocation({
            latitude: last.coords.latitude,
            longitude: last.coords.longitude,
          });
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch {
        // Emulator / GPS off — map still uses Tashkent default region.
      }
    })();
  }, []);

  useEffect(() => {
    if (!filtered.length) return;
    const tmr = setTimeout(() => mapRef.current?.fitToClinics(filtered), 400);
    return () => clearTimeout(tmr);
  }, [filtered]);

  const onToggleFilter = useCallback((id: MapFilterId) => {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const onSelectClinic = useCallback((id: string) => {
    setSelectedId(id);
    sheetRef.current?.snapToIndex(0);
  }, []);

  const goMyLocation = useCallback(() => {
    const region = userLocation
      ? { ...userLocation, latitudeDelta: 0.04, longitudeDelta: 0.04 }
      : TASHKENT_REGION;
    mapRef.current?.animateToRegion(region);
  }, [userLocation]);

  return (
    <View style={styles.fill}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <DentalMap
        ref={mapRef}
        clinics={filtered}
        selectedClinicId={selectedId}
        userLocation={userLocation}
        onSelectClinic={onSelectClinic}
        style={StyleSheet.absoluteFill}
      />

      <View
        pointerEvents="box-none"
        style={[styles.topChrome, { paddingTop: insets.top + spacing.sm, gap: spacing.sm }]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={[
              styles.iconBtn,
              shadows.sm,
              { backgroundColor: colors.surface, borderRadius: radius.full },
            ]}
          >
            <ArrowLeft color={colors.text} size={18} />
          </Pressable>
          <Pressable
            style={[
              styles.locChip,
              shadows.sm,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.full,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <MapPin color={colors.primary} size={16} />
            <Text variant="label" numberOfLines={1}>
              {t('map.city_tashkent')}
            </Text>
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        <Pressable
          onPress={() => router.push('/(client)/(tabs)/search')}
          style={[
            styles.searchBar,
            shadows.md,
            {
              marginHorizontal: spacing.lg,
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <Search color={colors.textMuted} size={20} />
          <Text variant="body" muted style={{ flex: 1 }} numberOfLines={1}>
            {t('map.search_placeholder')}
          </Text>
          <SlidersHorizontal color={colors.primary} size={18} />
        </Pressable>

        <MapFilters active={activeFilters} onToggle={onToggleFilter} />
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.fabWrap, { bottom: 24 + Math.max(insets.bottom, 8) }]}
      >
        <MyLocationButton onPress={goMyLocation} />
      </View>

      {!isLoading && filtered.length === 0 && (
        <View
          style={[
            styles.emptyBanner,
            { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadows.md },
          ]}
        >
          <Text variant="bodySmall" center>
            {t('search.no_results')}
          </Text>
        </View>
      )}

      <ClinicPreviewSheet
        ref={sheetRef}
        clinic={selectedClinic}
        isFavorite={
          selectedClinic ? favoriteClinicIds.includes(selectedClinic.id) : false
        }
        onToggleFavorite={() => {
          if (selectedClinic) toggleClinicFavorite(selectedClinic.id);
        }}
        onViewClinic={() => {
          if (!selectedClinic) return;
          sheetRef.current?.close();
          router.push(`/(client)/clinic/${selectedClinic.id}`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  locChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    maxWidth: 180,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    minHeight: 52,
  },
  fabWrap: {
    position: 'absolute',
    right: 0,
    zIndex: 5,
  },
  emptyBanner: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
});
