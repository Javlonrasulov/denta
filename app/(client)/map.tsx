import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import type { Region } from 'react-native-maps';
import * as Haptics from 'expo-haptics';

import {
  ArrowLeft,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
} from '@/components/icons';
import {
  ClinicPreviewSheet,
  DentalMap,
  MapFilters,
  MyLocationButton,
  NavigatorPickerModal,
  RegionPickerModal,
  TASHKENT_REGION,
  UZ_REGIONS,
  filterClinicsForMap,
  regionToCamera,
  type DentalMapHandle,
  type MapFilterId,
  type UzRegionId,
} from '@/components/map';
import { useClinics } from '@/hooks/queries';
import { getNearbyClinics } from '@/services/clinicService';
import {
  openGoogleMapsDriving,
  openYandexNavigator,
} from '@/services/navigatorLinks';
import {
  fetchDrivingRoute,
  formatRouteDistance,
  formatRouteDurationMinutes,
  type DrivingRoute,
  type LatLng,
} from '@/services/routingService';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import type { Clinic } from '@/types';
import * as Linking from 'expo-linking';

function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Emulator GPS is often Mountain View — don't leave Tashkent marketplace empty. */
function isNearMarketplace(
  coords: { latitude: number; longitude: number },
  maxKm = 180,
): boolean {
  return (
    haversineKm(coords, {
      latitude: TASHKENT_REGION.latitude,
      longitude: TASHKENT_REGION.longitude,
    }) <= maxKm
  );
}

export default function FullMapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { clinicId: focusClinicId } = useLocalSearchParams<{ clinicId?: string }>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { data: clinics = [], isLoading, isError, refetch } = useClinics();
  const favoriteClinicIds = useFavoritesStore((s) => s.clinicIds);
  const toggleClinicFavorite = useFavoritesStore((s) => s.toggleClinic);

  const mapRef = useRef<DentalMapHandle>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const didCenterRef = useRef(false);
  const searchOriginRef = useRef({
    latitude: TASHKENT_REGION.latitude,
    longitude: TASHKENT_REGION.longitude,
  });

  const [activeFilters, setActiveFilters] = useState<MapFilterId[]>(['nearby']);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  const [selectedRegionId, setSelectedRegionId] =
    useState<UzRegionId>('tashkent_city');
  const [showAreaSearch, setShowAreaSearch] = useState(false);
  const [areaBusy, setAreaBusy] = useState(false);
  const [areaClinics, setAreaClinics] = useState<Clinic[] | null>(null);
  const [mapCenter, setMapCenter] = useState({
    latitude: TASHKENT_REGION.latitude,
    longitude: TASHKENT_REGION.longitude,
  });
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [locationPrompt, setLocationPrompt] = useState(false);
  const [locationNeedsSettings, setLocationNeedsSettings] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const routeReqId = useRef(0);

  const sourceClinics = areaClinics ?? clinics;

  const filtered = useMemo(
    () => filterClinicsForMap(sourceClinics, activeFilters),
    [sourceClinics, activeFilters],
  );

  const openCount = useMemo(
    () => filtered.filter((c) => c.isOpenNow).length,
    [filtered],
  );

  const selectedClinic = useMemo(
    () => sourceClinics.find((c) => c.id === selectedId) ?? null,
    [sourceClinics, selectedId],
  );

  const initialRegion = useMemo<Region>(() => {
    if (userLocation && isNearMarketplace(userLocation)) {
      return { ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    }
    return TASHKENT_REGION;
  }, [userLocation]);

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
    if (didCenterRef.current || !userLocation) return;
    if (!isNearMarketplace(userLocation)) return;
    didCenterRef.current = true;
    searchOriginRef.current = userLocation;
    mapRef.current?.animateToRegion(
      { ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      500,
    );
  }, [userLocation]);

  useEffect(() => {
    if (!filtered.length || selectedId) return;
    // Prefer clinic cluster once data is ready (beats far-away emulator GPS).
    const tmr = setTimeout(() => mapRef.current?.fitToClinics(filtered), 450);
    return () => clearTimeout(tmr);
  }, [filtered, selectedId]);

  const clearRoute = useCallback(() => {
    routeReqId.current += 1;
    setRoute(null);
    setRouteError(null);
    setRouteLoading(false);
  }, []);

  const loadDrivingRoute = useCallback(
    async (clinic: Clinic, origin: LatLng) => {
      const reqId = ++routeReqId.current;
      setRouteLoading(true);
      setRouteError(null);
      setRoute(null);
      try {
        const result = await fetchDrivingRoute({
          origin,
          destination: clinic.coordinates,
        });
        if (reqId !== routeReqId.current) return;
        setRoute(result);
        mapRef.current?.fitToCoordinates(
          [origin, clinic.coordinates, ...result.coordinates],
          { top: 0.45, bottom: 0.55, left: 0.2, right: 0.2 },
        );
      } catch {
        if (reqId !== routeReqId.current) return;
        setRoute(null);
        setRouteError(t('map.route_failed'));
      } finally {
        if (reqId === routeReqId.current) setRouteLoading(false);
      }
    },
    [t],
  );

  const ensureLocationThenRoute = useCallback(
    async (clinic: Clinic) => {
      try {
        const current = await Location.getForegroundPermissionsAsync();
        if (current.status !== 'granted') {
          if (!current.canAskAgain) {
            setLocationNeedsSettings(true);
            setLocationPrompt(true);
            return;
          }
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            const again = await Location.getForegroundPermissionsAsync();
            setLocationNeedsSettings(!again.canAskAgain);
            setLocationPrompt(true);
            return;
          }
        }
        setLocationPrompt(false);
        setLocationNeedsSettings(false);
        let origin = userLocation;
        if (!origin) {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          origin = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setUserLocation(origin);
        }
        // Emulator default GPS is often Mountain View — use city center for
        // marketplace routing so road polyline is local and useful.
        if (!isNearMarketplace(origin, 250)) {
          origin = {
            latitude: TASHKENT_REGION.latitude,
            longitude: TASHKENT_REGION.longitude,
          };
        }
        await loadDrivingRoute(clinic, origin);
      } catch {
        setRouteError(t('map.route_failed'));
        setRouteLoading(false);
      }
    },
    [loadDrivingRoute, t, userLocation],
  );

  const selectedRegion = useMemo(
    () => UZ_REGIONS.find((r) => r.id === selectedRegionId) ?? UZ_REGIONS[0],
    [selectedRegionId],
  );

  const searchThisAreaFor = useCallback(
    async (center: { latitude: number; longitude: number }) => {
      setAreaBusy(true);
      try {
        const rows = await getNearbyClinics(40, center);
        setAreaClinics(rows);
        searchOriginRef.current = center;
        setShowAreaSearch(false);
        if (rows.length) {
          setTimeout(() => mapRef.current?.fitToClinics(rows), 200);
        }
      } catch {
        // keep markers
      } finally {
        setAreaBusy(false);
      }
    },
    [],
  );

  const onSelectRegion = useCallback(
    (id: UzRegionId) => {
      const region = UZ_REGIONS.find((r) => r.id === id);
      if (!region) return;
      setSelectedRegionId(id);
      setRegionPickerOpen(false);
      setSelectedId(null);
      sheetRef.current?.close();
      const camera = regionToCamera(region);
      searchOriginRef.current = {
        latitude: camera.latitude,
        longitude: camera.longitude,
      };
      setMapCenter({
        latitude: camera.latitude,
        longitude: camera.longitude,
      });
      mapRef.current?.animateToRegion(camera, 500);
      setShowAreaSearch(false);
      void searchThisAreaFor({
        latitude: camera.latitude,
        longitude: camera.longitude,
      });
    },
    [searchThisAreaFor],
  );

  const onToggleFilter = useCallback((id: MapFilterId) => {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const onSelectClinic = useCallback(
    (id: string) => {
      const clinic = sourceClinics.find((c) => c.id === id);
      setSelectedId(id);
      setSheetOpen(true);
      sheetRef.current?.snapToIndex(0);
      clearRoute();
      if (clinic) void ensureLocationThenRoute(clinic);
    },
    [clearRoute, ensureLocationThenRoute, sourceClinics],
  );

  const didFocusParam = useRef<string | null>(null);
  useEffect(() => {
    const id = Array.isArray(focusClinicId) ? focusClinicId[0] : focusClinicId;
    if (!id || didFocusParam.current === id) return;
    const clinic = sourceClinics.find((c) => c.id === id);
    if (!clinic) return;
    didFocusParam.current = id;
    onSelectClinic(id);
    mapRef.current?.animateToRegion(
      { ...clinic.coordinates, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      480,
    );
  }, [focusClinicId, onSelectClinic, sourceClinics]);

  const onSheetChange = useCallback(
    (index: number) => {
      const open = index >= 0;
      setSheetOpen(open);
      if (!open) {
        setSelectedId(null);
        clearRoute();
        setNavigatorOpen(false);
      }
    },
    [clearRoute],
  );

  const routeInfo = useMemo(() => {
    if (routeLoading) return { distanceLabel: '', durationLabel: '', loading: true };
    if (routeError) return { distanceLabel: '', durationLabel: '', error: routeError };
    if (!route) return null;
    const mins = formatRouteDurationMinutes(route.durationSeconds);
    return {
      distanceLabel: formatRouteDistance(route.distanceMeters, {
        m: t('map.unit_m'),
        km: t('map.unit_km'),
      }),
      durationLabel: t('map.duration_minutes', { count: mins }),
    };
  }, [route, routeError, routeLoading, t]);

  const goMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setUserLocation(next);
      if (isNearMarketplace(next)) {
        mapRef.current?.animateToRegion(
          { ...next, latitudeDelta: 0.04, longitudeDelta: 0.04 },
          450,
        );
      } else {
        // Far GPS (e.g. emulator default) — keep marketplace city in view.
        mapRef.current?.animateToRegion(TASHKENT_REGION, 450);
      }
    } catch {
      mapRef.current?.animateToRegion(TASHKENT_REGION, 450);
    }
  }, []);

  const onRegionChangeComplete = useCallback((region: Region) => {
    const center = { latitude: region.latitude, longitude: region.longitude };
    setMapCenter(center);
    const moved = haversineKm(searchOriginRef.current, center);
    setShowAreaSearch(moved > 1.2);
  }, []);

  const searchThisArea = useCallback(async () => {
    await searchThisAreaFor(mapCenter);
  }, [mapCenter, searchThisAreaFor]);

  const surface = {
    backgroundColor: isDark ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.96)',
    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
  };

  const fabBottom = sheetOpen
    ? 340 + Math.max(insets.bottom, 8)
    : 24 + Math.max(insets.bottom, 8);

  return (
    <View style={styles.fill}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <DentalMap
        ref={mapRef}
        clinics={filtered}
        selectedClinicId={selectedId}
        userLocation={userLocation}
        routeCoordinates={route?.coordinates}
        onSelectClinic={onSelectClinic}
        onRegionChangeComplete={onRegionChangeComplete}
        initialRegion={initialRegion}
        style={StyleSheet.absoluteFill}
      />

      <View
        pointerEvents="box-none"
        style={[styles.topChrome, { paddingTop: insets.top + 8 }]}
      >
        {/* Row 1: back + city */}
        <View style={styles.row1}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            style={[styles.iconBtn, surface]}
          >
            <ArrowLeft color={colors.text} size={18} strokeWidth={2.2} />
          </Pressable>

          <Pressable
            onPress={() => setRegionPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('map.select_region')}
            style={[styles.locChip, surface]}
          >
            <MapPin color={colors.primary} size={14} strokeWidth={2.2} />
            <RNText
              numberOfLines={1}
              style={{
                fontSize: 14,
                lineHeight: 18,
                fontWeight: '700',
                color: colors.text,
                includeFontPadding: false,
                marginLeft: 6,
                marginRight: 2,
                fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
              }}
            >
              {t(selectedRegion.labelKey)}
            </RNText>
            <ChevronDown size={14} color={colors.textMuted} />
          </Pressable>

          {openCount > 0 ? (
            <View style={[styles.openChip, surface]}>
              <View style={[styles.openDot, { backgroundColor: colors.success }]} />
              <RNText
                style={{
                  fontSize: 12,
                  lineHeight: 15,
                  fontWeight: '700',
                  color: colors.text,
                  includeFontPadding: false,
                }}
              >
                {t('map.open_count', { count: openCount })}
              </RNText>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>

        {/* Row 2: search + filter */}
        <View style={styles.row2}>
          <Pressable
            onPress={() => router.push('/(client)/(tabs)/search')}
            style={[styles.searchBar, surface]}
          >
            <Search color={colors.textMuted} size={18} strokeWidth={2} />
            <RNText
              numberOfLines={1}
              style={{
                flex: 1,
                marginLeft: 10,
                fontSize: 14,
                lineHeight: 18,
                color: colors.textMuted,
                includeFontPadding: false,
              }}
            >
              {t('map.search_placeholder')}
            </RNText>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/(client)/(tabs)/search', params: { filter: '1' } })}
            accessibilityLabel={t('common.filter')}
            style={[styles.filterBtn, surface]}
          >
            <SlidersHorizontal color={colors.primary} size={18} strokeWidth={2.1} />
          </Pressable>
        </View>

        {/* Row 3: chips */}
        <MapFilters active={activeFilters} onToggle={onToggleFilter} />
      </View>

      {showAreaSearch ? (
        <View
          pointerEvents="box-none"
          style={[styles.areaWrap, { top: insets.top + 148 }]}
        >
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              void searchThisArea();
            }}
            style={[styles.areaBtn, { backgroundColor: colors.primary }]}
          >
            {areaBusy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <RNText
                style={{
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: '700',
                  includeFontPadding: false,
                }}
              >
                {t('map.search_this_area')}
              </RNText>
            )}
          </Pressable>
        </View>
      ) : null}

      <View pointerEvents="box-none" style={[styles.fabWrap, { bottom: fabBottom }]}>
        <MyLocationButton onPress={() => void goMyLocation()} />
      </View>

      {isError ? (
        <View style={[styles.emptyBanner, surface]}>
          <RNText style={{ color: colors.text, fontWeight: '600', textAlign: 'center' }}>
            {t('error.something_wrong')}
          </RNText>
          <Pressable onPress={() => refetch()} style={{ marginTop: 8 }}>
            <RNText style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}>
              {t('common.retry')}
            </RNText>
          </Pressable>
        </View>
      ) : null}

      {!isLoading && !isError && filtered.length === 0 ? (
        <View style={[styles.emptyBanner, surface]}>
          <RNText
            style={{
              color: colors.text,
              fontWeight: '600',
              textAlign: 'center',
              fontSize: 14,
            }}
          >
            {t('map.no_clinics_area')}
          </RNText>
        </View>
      ) : null}

      <ClinicPreviewSheet
        ref={sheetRef}
        clinic={selectedClinic}
        routeInfo={routeInfo}
        isFavorite={
          selectedClinic ? favoriteClinicIds.includes(selectedClinic.id) : false
        }
        onToggleFavorite={() => {
          if (selectedClinic) toggleClinicFavorite(selectedClinic.id);
        }}
        onChange={onSheetChange}
        onRetryRoute={() => {
          if (selectedClinic) void ensureLocationThenRoute(selectedClinic);
        }}
        onNavigator={() => setNavigatorOpen(true)}
        onViewClinic={() => {
          if (!selectedClinic) return;
          sheetRef.current?.close();
          router.push(`/(client)/clinic/${selectedClinic.id}`);
        }}
        onBook={() => {
          if (!selectedClinic) return;
          sheetRef.current?.close();
          router.push({
            pathname: '/(client)/booking',
            params: { clinicId: selectedClinic.id },
          });
        }}
      />

      <NavigatorPickerModal
        visible={navigatorOpen}
        onClose={() => setNavigatorOpen(false)}
        onYandex={() => {
          setNavigatorOpen(false);
          if (selectedClinic) void openYandexNavigator(selectedClinic.coordinates);
        }}
        onGoogle={() => {
          setNavigatorOpen(false);
          if (selectedClinic) void openGoogleMapsDriving(selectedClinic.coordinates);
        }}
      />

      {locationPrompt ? (
        <View style={[styles.permCard, surface]}>
          <RNText
            style={{
              color: colors.text,
              fontWeight: '700',
              fontSize: 14,
              textAlign: 'center',
              includeFontPadding: false,
            }}
          >
            {t('map.route_need_location')}
          </RNText>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Pressable
              onPress={() => setLocationPrompt(false)}
              style={[styles.permBtn, { borderColor: colors.borderSubtle }]}
            >
              <RNText style={{ color: colors.textMuted, fontWeight: '700' }}>
                {t('map.later')}
              </RNText>
            </Pressable>
            <Pressable
              onPress={() => {
                void (async () => {
                  if (locationNeedsSettings) {
                    void Linking.openSettings();
                    return;
                  }
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status === 'granted' && selectedClinic) {
                    setLocationPrompt(false);
                    setLocationNeedsSettings(false);
                    void ensureLocationThenRoute(selectedClinic);
                  } else {
                    const again = await Location.getForegroundPermissionsAsync();
                    setLocationNeedsSettings(!again.canAskAgain);
                    if (!again.canAskAgain) void Linking.openSettings();
                  }
                })();
              }}
              style={[styles.permBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <RNText style={{ color: '#FFFFFF', fontWeight: '700' }}>
                {locationNeedsSettings
                  ? t('map.open_settings')
                  : t('map.allow_location')}
              </RNText>
            </Pressable>
          </View>
        </View>
      ) : null}

      <RegionPickerModal
        visible={regionPickerOpen}
        selectedId={selectedRegionId}
        onSelect={onSelectRegion}
        onClose={() => setRegionPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#E8EEF5' },
  topChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    gap: 6,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  locChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    flexShrink: 0,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  openChip: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  openDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  fabWrap: {
    position: 'absolute',
    right: 0,
    zIndex: 5,
  },
  areaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 8,
  },
  areaBtn: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  emptyBanner: {
    position: 'absolute',
    alignSelf: 'center',
    top: '48%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: '84%',
    zIndex: 6,
  },
  permCard: {
    position: 'absolute',
    alignSelf: 'center',
    left: 24,
    right: 24,
    bottom: '28%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    zIndex: 20,
  },
  permBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
