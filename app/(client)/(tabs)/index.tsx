import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';

import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Heart,
  Maximize2,
  Moon,
  RefreshCw,
  Search,
  Stethoscope,
  Sun,
} from '@/components/icons';
import { ClinicCard } from '@/components/clinic/ClinicCard';
import { DentalMap, TASHKENT_REGION, type DentalMapHandle } from '@/components/map';
import { Text } from '@/components/ui/Text';
import { useClinics, usePopularClinics } from '@/hooks/queries';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useFavoritesStore, useUserStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import { LocaleCode } from '@/types';

const LOCALES: { code: LocaleCode; label: string; short: string }[] = [
  { code: 'uz', label: 'O‘zbekcha', short: 'UZ' },
  { code: 'uz-Cyrl', label: 'Ўзбекча', short: 'ЎЗ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
];

const KPI_GRADIENTS: [string, string][] = [
  ['#6D28D9', '#4F46E5'],
  ['#0891B2', '#2563EB'],
  ['#EA580C', '#F43F5E'],
];

export default function HomeDashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { colors, spacing, radius, shadows, isDark } = useTheme();

  const user = useUserStore();
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const favoriteClinicIds = useFavoritesStore((s) => s.clinicIds);
  const appointments = useAppointmentsStore((s) => s.appointments);

  const { data: clinics = [], isLoading, refetch } = useClinics();
  const { data: popular = [] } = usePopularClinics(6);

  const mapRef = useRef<DentalMapHandle>(null);
  const langBtnRef = useRef<View>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [langPos, setLangPos] = useState({ top: 56, right: 16 });
  const [refreshing, setRefreshing] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const currentLocale = LOCALES.find((item) => item.code === locale) ?? LOCALES[0];
  const displayName = user.fullName.split(' ')[0] ?? user.fullName;
  const upcomingCount = appointments.filter((a) => a.status === 'upcoming').length;
  const openCount = clinics.filter((c) => c.isOpenNow).length;

  const kpis = [
    { label: t('home.stat_appointments'), value: String(upcomingCount) },
    { label: t('home.stat_nearby'), value: String(clinics.length) },
    { label: t('home.stat_favorites'), value: String(favoriteClinicIds.length) },
  ];

  const actions = [
    {
      id: 'search',
      label: t('tabs.search'),
      icon: Search,
      tint: colors.warningMuted,
      iconColor: colors.warning,
      onPress: () => router.push('/(client)/(tabs)/search'),
    },
    {
      id: 'book',
      label: t('home.book'),
      icon: CalendarDays,
      tint: colors.successMuted,
      iconColor: colors.success,
      onPress: () => router.push('/(client)/(tabs)/search'),
    },
    {
      id: 'doctors',
      label: t('home.top_doctors'),
      icon: Stethoscope,
      tint: colors.errorMuted,
      iconColor: colors.error,
      onPress: () => router.push('/(client)/(tabs)/search'),
    },
    {
      id: 'favorites',
      label: t('tabs.favorites'),
      icon: Heart,
      tint: colors.primaryMuted,
      iconColor: colors.primary,
      onPress: () => router.push('/(client)/(tabs)/favorites'),
    },
  ];

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
        // Emulator / GPS off
      }
    })();
  }, []);

  useEffect(() => {
    if (!clinics.length) return;
    const tmr = setTimeout(() => mapRef.current?.fitToClinics(clinics), 500);
    return () => clearTimeout(tmr);
  }, [clinics]);

  const openLanguageMenu = () => {
    langBtnRef.current?.measureInWindow((x, y, width, height) => {
      setLangPos({
        top: y + height + 8,
        right: Math.max(8, windowWidth - x - width),
      });
      setLangOpen(true);
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), queryClient.invalidateQueries()]);
    setRefreshing(false);
  }, [queryClient, refetch]);

  const iconBtn = {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: 120,
          gap: spacing.xl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View
          style={{
            paddingHorizontal: spacing.xl,
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: spacing.md,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="caption" muted>
              {t('home.assalamu_alaykum')}
            </Text>
            <Text variant="h1" numberOfLines={1} style={{ marginTop: 2 }}>
              {displayName}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View ref={langBtnRef} collapsable={false}>
              <Pressable
                onPress={openLanguageMenu}
                accessibilityRole="button"
                accessibilityLabel={t('profile.language')}
                style={{
                  height: 40,
                  paddingHorizontal: 10,
                  borderRadius: 14,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text variant="caption" weight="semibold">
                  {currentLocale.short}
                </Text>
                <ChevronDown size={14} color={colors.textMuted} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
              accessibilityRole="button"
              style={iconBtn}
            >
              {isDark ? (
                <Sun size={18} color={colors.text} />
              ) : (
                <Moon size={18} color={colors.text} />
              )}
            </Pressable>
            <Pressable onPress={onRefresh} accessibilityRole="button" style={iconBtn}>
              <RefreshCw size={18} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/(client)/(tabs)/profile')}
              accessibilityRole="button"
              style={iconBtn}
            >
              <Bell size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12 }}
        >
          {kpis.map((kpi, index) => (
            <LinearGradient
              key={kpi.label}
              colors={KPI_GRADIENTS[index]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                shadows.md,
                {
                  width: 168,
                  minHeight: 92,
                  borderRadius: 22,
                  padding: 16,
                  justifyContent: 'space-between',
                },
              ]}
            >
              <Text variant="caption" color="rgba(255,255,255,0.82)">
                {kpi.label}
              </Text>
              <Text variant="kpi" color="#FFFFFF">
                {kpi.value}
              </Text>
            </LinearGradient>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Text variant="h3">{t('home.quick_actions')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Pressable
                  key={action.id}
                  onPress={action.onPress}
                  style={({ pressed }) => [
                    shadows.sm,
                    {
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderRadius: 20,
                      paddingVertical: 14,
                      paddingHorizontal: 6,
                      alignItems: 'center',
                      gap: 10,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 16,
                      backgroundColor: action.tint,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} color={action.iconColor} strokeWidth={2} />
                  </View>
                  <Text variant="caption" weight="semibold" center numberOfLines={2}>
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.xl }}>
          <View
            style={[
              shadows.md,
              {
                backgroundColor: colors.surface,
                borderRadius: 24,
                padding: 14,
                gap: 12,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text variant="h3">{t('home.clinics_map')}</Text>
                <Text variant="caption" muted style={{ marginTop: 2 }}>
                  {t('home.map_subtitle')}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.successMuted,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: radius.full,
                }}
              >
                <Text variant="caption" weight="semibold" color={colors.success}>
                  {t('home.open_count', { count: openCount })}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/(client)/map')}
                accessibilityRole="button"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Maximize2 size={16} color={colors.text} />
              </Pressable>
            </View>

            <View
              style={{
                height: 220,
                borderRadius: 18,
                overflow: 'hidden',
                backgroundColor: colors.surfaceSoft,
              }}
            >
              <DentalMap
                ref={mapRef}
                compact
                clinics={clinics}
                userLocation={userLocation}
                mapType={mapType}
                initialRegion={TASHKENT_REGION}
                onSelectClinic={(id) => router.push(`/(client)/clinic/${id}`)}
                style={{ flex: 1 }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 10,
                  bottom: 10,
                  flexDirection: 'row',
                  backgroundColor: colors.surface,
                  borderRadius: radius.full,
                  padding: 3,
                  ...shadows.sm,
                }}
              >
                {(['standard', 'satellite'] as const).map((type) => {
                  const active = mapType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setMapType(type)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: radius.full,
                        backgroundColor: active ? colors.primary : 'transparent',
                      }}
                    >
                      <Text
                        variant="caption"
                        weight="semibold"
                        color={active ? colors.textInverse : colors.textMuted}
                      >
                        {type === 'standard' ? t('home.map_view') : t('home.satellite')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.lg, paddingHorizontal: 4 }}>
              {[
                { color: colors.primary, label: t('home.legend_clinics') },
                { color: colors.success, label: t('home.legend_open') },
                { color: colors.textMuted, label: t('home.legend_closed') },
              ].map((item) => (
                <View
                  key={item.label}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: item.color,
                    }}
                  />
                  <Text variant="caption" muted>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text variant="h3">{t('home.popular_clinics')}</Text>
            <Pressable onPress={() => router.push('/(client)/(tabs)/search')}>
              <Text variant="caption" weight="semibold" color={colors.primary}>
                {t('common.see_all')}
              </Text>
            </Pressable>
          </View>
          <View style={{ gap: spacing.md }}>
            {popular.slice(0, 3).map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                onPress={() => router.push(`/(client)/clinic/${clinic.id}`)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setLangOpen(false)}>
          <View
            style={[
              shadows.lg,
              {
                position: 'absolute',
                top: langPos.top,
                right: langPos.right,
                width: 200,
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                overflow: 'hidden',
                paddingVertical: 6,
              },
            ]}
          >
            {LOCALES.map((item) => {
              const active = item.code === locale;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => {
                    setLocale(item.code);
                    setLangOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: active ? colors.primaryMuted : 'transparent',
                  }}
                >
                  <Text variant="body" weight={active ? 'semibold' : 'regular'}>
                    {item.label}
                  </Text>
                  {active ? <Check size={16} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
