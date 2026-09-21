import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import {
  BadgeCheck,
  Bell,
  Building2,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  Maximize2,
  Moon,
  Search,
  Shield,
  Stethoscope,
  Sun,
} from '@/components/icons';
import { FeaturedClinicCard } from '@/components/client/home/FeaturedClinicCard';
import { FeaturedDoctorCard } from '@/components/client/home/FeaturedDoctorCard';
import { OsmTileMap } from '@/components/map/OsmTileMap';
import {
  LanguageMenuItems,
  languageMenuCardStyle,
  LOCALE_OPTIONS,
} from '@/components/ui/LanguageMenu';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useClinics, usePopularClinics, useTopDoctors } from '@/hooks/queries';
import { useSettingsStore } from '@/store/settingsStore';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/theme';

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

  const { data: clinics = [], isLoading, refetch } = useClinics();
  const { data: popularRaw = [] } = usePopularClinics(6);
  const { data: topDoctorsRaw = [] } = useTopDoctors(6);

  const langBtnRef = useRef<View>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [langPos, setLangPos] = useState({ top: 56, right: 16 });
  const [refreshing, setRefreshing] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [mapActive, setMapActive] = useState(false);

  const currentLocale = LOCALE_OPTIONS.find((item) => item.code === locale) ?? LOCALE_OPTIONS[0];
  const displayName = user.fullName.split(' ')[0] ?? user.fullName;
  const openCount = useMemo(() => clinics.filter((c) => c.isOpenNow).length, [clinics]);
  const nearbyPreview = useMemo(
    () => [...clinics].sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99)).slice(0, 12),
    [clinics],
  );
  const featuredClinics =
    popularRaw.length > 0 ? popularRaw.slice(0, 6) : nearbyPreview.slice(0, 6);
  const featuredDoctors = topDoctorsRaw.slice(0, 6);
  const clinicNameById = useMemo(
    () => Object.fromEntries(clinics.map((c) => [c.id, c.name])),
    [clinics],
  );

  const actions = [
    {
      id: 'clinics',
      label: t('home.action_clinics'),
      icon: Building2,
      onPress: () => router.push('/(client)/(tabs)/search'),
    },
    {
      id: 'doctors',
      label: t('home.action_doctors'),
      icon: Stethoscope,
      onPress: () => router.push({ pathname: '/(client)/(tabs)/search', params: { tab: 'doctors' } }),
    },
    {
      id: 'book',
      label: t('home.action_book'),
      icon: CalendarPlus,
      onPress: () => router.push('/(client)/(tabs)/search'),
    },
    {
      id: 'favorites',
      label: t('home.action_favorites'),
      icon: Heart,
      onPress: () => router.push('/(client)/(tabs)/favorites'),
    },
  ] as const;

  const trustItems = [
    { icon: BadgeCheck, label: t('home.trust_verified') },
    { icon: Stethoscope, label: t('home.trust_doctors') },
    { icon: Clock, label: t('home.trust_booking') },
    { icon: Shield, label: t('home.trust_slots') },
  ] as const;

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

  const goSearch = () => router.push('/(client)/(tabs)/search');
  const goMap = () => router.push('/(client)/map');
  const cardWidth = Math.min(280, windowWidth * 0.72);

  const clusterBtn = {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        scrollEnabled={!mapActive}
        contentContainerStyle={{ paddingBottom: 36 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Hero ───────────────────────────────────────────── */}
        <LinearGradient
          colors={
            isDark
              ? ['#1E1B4B', '#0F172A', colors.background]
              : ['#EEF2FF', '#ECFEFF', colors.background]
          }
          locations={[0, 0.62, 1]}
          style={{ paddingTop: insets.top + 8, paddingBottom: 8, overflow: 'hidden' }}
        >
          <View
            pointerEvents="none"
            style={{ position: 'absolute', right: -48, top: 8, width: 220, height: 220 }}
          >
            <View
              style={{
                position: 'absolute',
                right: 24,
                top: 12,
                width: 168,
                height: 168,
                borderRadius: 84,
                backgroundColor: isDark ? 'rgba(34,211,238,0.10)' : 'rgba(8,145,178,0.12)',
              }}
            />
            <View
              style={{
                position: 'absolute',
                right: 88,
                top: 64,
                width: 92,
                height: 92,
                borderRadius: 46,
                backgroundColor: isDark ? 'rgba(129,140,248,0.16)' : 'rgba(67,56,202,0.14)',
              }}
            />
          </View>

          <View
            style={{
              paddingHorizontal: spacing.xl,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <Pressable
              onPress={goMap}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: radius.full,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.78)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.95)',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <MapPin size={14} color={colors.primary} strokeWidth={2.2} />
              <Text variant="caption" weight="semibold">
                {t('home.city_tashkent')}
              </Text>
              <ChevronDown size={13} color={colors.textMuted} />
            </Pressable>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.78)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.95)',
                borderRadius: radius.full,
                paddingHorizontal: 4,
              }}
            >
              <View ref={langBtnRef} collapsable={false}>
                <Pressable
                  onPress={openLanguageMenu}
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.language')}
                  style={[clusterBtn, { width: undefined, paddingHorizontal: 8, flexDirection: 'row', gap: 2 }]}
                >
                  <Text variant="caption" weight="semibold">
                    {currentLocale.short}
                  </Text>
                  <ChevronDown size={12} color={colors.textMuted} />
                </Pressable>
              </View>
              <View style={{ width: 1, height: 16, backgroundColor: colors.border }} />
              <Pressable
                onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
                accessibilityRole="button"
                style={clusterBtn}
              >
                {isDark ? <Sun size={16} color={colors.text} /> : <Moon size={16} color={colors.text} />}
              </Pressable>
              <View style={{ width: 1, height: 16, backgroundColor: colors.border }} />
              <Pressable
                onPress={() => router.push('/(client)/(tabs)/profile')}
                accessibilityRole="button"
                style={clusterBtn}
              >
                <Bell size={16} color={colors.text} />
              </Pressable>
            </View>
          </View>

          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: isDark ? 'rgba(34,211,238,0.18)' : 'rgba(8,145,178,0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Stethoscope size={16} color={colors.secondary} strokeWidth={2} />
              </View>
              <Text
                variant="caption"
                weight="semibold"
                color={colors.secondary}
                style={{ letterSpacing: 1.2, fontSize: 11, textTransform: 'uppercase' }}
              >
                {t('home.hero_kicker')}
              </Text>
            </View>

            <Text variant="caption" muted style={{ marginBottom: 6 }}>
              {t('home.assalamu_alaykum')}
              {displayName ? `, ${displayName}` : ''}
            </Text>
            <Text
              variant="h1"
              style={{ fontSize: 30, lineHeight: 36, letterSpacing: -0.7, maxWidth: 300 }}
            >
              {t('home.hero_title')}
            </Text>
            <Text variant="body" muted style={{ marginTop: 8, maxWidth: 310, lineHeight: 21 }}>
              {t('home.hero_subtitle')}
            </Text>

            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                goSearch();
              }}
              accessibilityRole="search"
              style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1, marginTop: 20 })}
            >
              <View
                style={[
                  shadows.lg,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: isDark ? colors.border : 'rgba(255,255,255,0.9)',
                  },
                ]}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: colors.primaryMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  <Search size={18} color={colors.primary} strokeWidth={2.1} />
                </View>
                <Text variant="body" muted numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
                  {t('home.search_placeholder')}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: colors.primary,
                    flexShrink: 0,
                  }}
                >
                  <Text variant="caption" weight="semibold" color={colors.textInverse}>
                    {t('home.cta_find_clinic')}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        </LinearGradient>

        {/* ── Shortcuts ──────────────────────────────────────── */}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: 4, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Pressable
                  key={action.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    action.onPress();
                  }}
                  style={({ pressed }) => [
                    shadows.sm,
                    {
                      flex: 1,
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 14,
                      paddingHorizontal: 4,
                      borderRadius: 18,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: colors.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} color={colors.primary} strokeWidth={1.9} />
                  </View>
                  <Text
                    variant="caption"
                    weight="semibold"
                    numberOfLines={1}
                    center
                    style={{ fontSize: 11, lineHeight: 14 }}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Map centerpiece ────────────────────────────────── */}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <View
            style={[
              shadows.lg,
              {
                backgroundColor: colors.surface,
                borderRadius: 26,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                overflow: 'hidden',
              },
            ]}
          >
            <View style={{ height: 292, backgroundColor: colors.surfaceSoft }}>
              <View
                style={{ flex: 1 }}
                onTouchStart={() => setMapActive(true)}
                onTouchEnd={() => setMapActive(false)}
                onTouchCancel={() => setMapActive(false)}
              >
                <OsmTileMap
                  clinics={nearbyPreview}
                  satellite={mapType === 'satellite'}
                  onSelectClinic={(id) => {
                    void Haptics.selectionAsync();
                    router.push(`/(client)/clinic/${id}`);
                  }}
                />
              </View>

              <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 88 }}>
                <LinearGradient
                  colors={['rgba(15,23,42,0.55)', 'transparent']}
                  style={{ flex: 1 }}
                />
              </View>

              <View
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  right: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    minWidth: 0,
                    backgroundColor: isDark ? 'rgba(17,24,39,0.88)' : 'rgba(255,255,255,0.94)',
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
                  }}
                >
                  <Text variant="label" numberOfLines={1} style={{ fontSize: 14 }}>
                    {t('home.clinics_map')}
                  </Text>
                  <Text variant="caption" muted numberOfLines={1} style={{ marginTop: 1 }}>
                    {t('home.map_subtitle')}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.success,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: radius.full,
                    flexShrink: 0,
                  }}
                >
                  <Text variant="caption" weight="semibold" color="#FFFFFF" style={{ fontSize: 11 }}>
                    {t('home.open_now_short', { count: openCount })}
                  </Text>
                </View>
                <Pressable
                  onPress={goMap}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.map_cta')}
                  style={({ pressed }) => ({
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: isDark ? 'rgba(17,24,39,0.88)' : 'rgba(255,255,255,0.94)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Maximize2 size={16} color={colors.primary} strokeWidth={2} />
                </Pressable>
              </View>

              <View
                style={{
                  position: 'absolute',
                  left: 12,
                  bottom: 12,
                  flexDirection: 'row',
                  backgroundColor: isDark ? 'rgba(17,24,39,0.92)' : 'rgba(255,255,255,0.96)',
                  borderRadius: radius.full,
                  padding: 3,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
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
                        style={{ fontSize: 11 }}
                      >
                        {type === 'standard' ? t('home.map_view') : t('home.satellite')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 12,
                gap: 10,
              }}
            >
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { color: colors.primary, label: t('home.legend_clinics') },
                  { color: colors.success, label: t('home.legend_open') },
                  { color: colors.textMuted, label: t('home.legend_closed') },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: radius.full,
                      backgroundColor: colors.surfaceSoft,
                    }}
                  >
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: item.color }} />
                    <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 11 }}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
              <Pressable
                onPress={goMap}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 2,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text variant="caption" weight="semibold" color={colors.primary}>
                  {t('home.map_cta')}
                </Text>
                <ChevronRight size={14} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Featured clinics ───────────────────────────────── */}
        <View style={{ paddingTop: spacing['3xl'], gap: spacing.md }}>
          <View
            style={{
              paddingHorizontal: spacing.xl,
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text variant="h2">{t('home.popular_clinics')}</Text>
              <Text variant="caption" muted>
                {t('home.popular_clinics_hint')}
              </Text>
            </View>
            <Pressable onPress={goSearch} hitSlop={8}>
              <Text variant="caption" weight="semibold" color={colors.primary}>
                {t('common.see_all')}
              </Text>
            </Pressable>
          </View>
          {isLoading && featuredClinics.length === 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 14 }}
            >
              {[0, 1].map((i) => (
                <Skeleton key={i} width={cardWidth} height={280} radius={22} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 14, paddingBottom: 4 }}
            >
              {featuredClinics.map((clinic) => (
                <FeaturedClinicCard
                  key={clinic.id}
                  clinic={clinic}
                  width={cardWidth}
                  onPress={() => router.push(`/(client)/clinic/${clinic.id}`)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Top doctors ────────────────────────────────────── */}
        <View style={{ paddingTop: spacing['3xl'], gap: spacing.md }}>
          <View
            style={{
              paddingHorizontal: spacing.xl,
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text variant="h2">{t('home.top_specialists')}</Text>
              <Text variant="caption" muted>
                {t('home.top_specialists_hint')}
              </Text>
            </View>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/(client)/(tabs)/search', params: { tab: 'doctors' } })
              }
              hitSlop={8}
            >
              <Text variant="caption" weight="semibold" color={colors.primary}>
                {t('common.see_all')}
              </Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 14, paddingBottom: 4 }}
          >
            {featuredDoctors.map((doctor) => (
              <FeaturedDoctorCard
                key={doctor.id}
                doctor={doctor}
                clinicName={clinicNameById[doctor.clinicId]}
                width={Math.min(300, windowWidth * 0.78)}
                onPress={() => router.push(`/(client)/doctor/${doctor.id}`)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── Trust ──────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing['3xl'], paddingBottom: 24 }}>
          <View
            style={{
              backgroundColor: isDark ? colors.surface : colors.surface,
              borderRadius: 22,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              gap: 12,
            }}
          >
            <Text variant="label">{t('home.trust_title')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <View
                    key={item.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: radius.full,
                      backgroundColor: colors.primaryMuted,
                    }}
                  >
                    <Icon size={14} color={colors.primary} strokeWidth={2} />
                    <Text variant="caption" weight="semibold" numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
        <View style={{ flex: 1 }}>
          <Pressable
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            onPress={() => setLangOpen(false)}
          />
          <View
            style={{
              position: 'absolute',
              top: langPos.top,
              right: langPos.right,
              ...languageMenuCardStyle(colors, shadows),
            }}
          >
            <LanguageMenuItems
              locale={locale}
              onSelect={(code) => {
                setLocale(code);
                setLangOpen(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
