import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text as RNText,
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
  CalendarClock,
  CalendarPlus,
  ChevronDown,
  Clock,
  Heart,
  MapPin,
  Moon,
  Search,
  Stethoscope,
  Sun,
} from '@/components/icons';
import { FeaturedClinicCard } from '@/components/client/home/FeaturedClinicCard';
import { FeaturedDoctorCard } from '@/components/client/home/FeaturedDoctorCard';
import { ClientNotificationsCenter } from '@/components/client/notifications/ClientNotificationsCenter';
import { HomeMapCard } from '@/components/map';
import {
  LanguageMenuItems,
  languageMenuCardStyle,
  LOCALE_OPTIONS,
} from '@/components/ui/LanguageMenu';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useClinics, usePopularClinics, useTopDoctors } from '@/hooks/queries';
import { useUnreadNotificationCount } from '@/hooks/useInboxNotifications';
import { useRealtimeAppointments } from '@/hooks/useRealtimeAppointments';
import { useSettingsStore } from '@/store/settingsStore';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import { formatUnreadBadge } from '@/utils/inboxNotifications';

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
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  useRealtimeAppointments();

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
    { id: 'verified', icon: BadgeCheck, label: t('home.trust_verified') },
    { id: 'doctors', icon: Stethoscope, label: t('home.trust_doctors') },
    { id: 'booking', icon: Clock, label: t('home.trust_booking') },
    { id: 'slots', icon: CalendarClock, label: t('home.trust_slots') },
  ] as const;

  const openLanguageMenu = () => {
    langBtnRef.current?.measureInWindow((x, y, width, height) => {
      const edge = 12;
      const menuWidth = 236;
      const preferredRight = Math.max(edge, windowWidth - x - width);
      const maxRight = Math.max(edge, windowWidth - menuWidth - edge);
      setLangPos({
        top: y + height + 8,
        right: Math.min(preferredRight, maxRight),
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
    width: 44,
    height: 44,
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
        contentContainerStyle={{ paddingBottom: 112 }}
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
          style={{ paddingTop: insets.top + 8, paddingBottom: 10 }}
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
              marginBottom: 16,
            }}
          >
            <Pressable
              onPress={goMap}
              hitSlop={4}
              style={({ pressed }) => ({
                paddingLeft: 12,
                paddingRight: 12,
                height: 44,
                borderRadius: 22,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.95)',
                opacity: pressed ? 0.85 : 1,
                justifyContent: 'center',
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MapPin size={14} color={colors.primary} strokeWidth={2.2} />
                <RNText
                  style={{
                    fontSize: 13,
                    lineHeight: 18,
                    letterSpacing: 0,
                    fontWeight: '600',
                    color: colors.text,
                    includeFontPadding: false,
                    marginLeft: 6,
                    marginRight: 4,
                  }}
                >
                  {t('home.city_tashkent')}
                </RNText>
                <ChevronDown size={13} color={colors.textMuted} />
              </View>
            </Pressable>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.78)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.95)',
                borderRadius: 22,
                height: 44,
                paddingHorizontal: 2,
              }}
            >
              <View ref={langBtnRef} collapsable={false}>
                <Pressable
                  onPress={openLanguageMenu}
                  accessibilityLabel={t('profile.language')}
                  style={{
                    height: 44,
                    minWidth: 52,
                    paddingHorizontal: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RNText
                    style={{
                      fontSize: 13,
                      lineHeight: 16,
                      letterSpacing: 0,
                      fontWeight: '600',
                      color: colors.text,
                      marginRight: 3,
                      includeFontPadding: false,
                      paddingRight: 2,
                    }}
                  >
                    {currentLocale.short}
                  </RNText>
                  <ChevronDown size={12} color={colors.textMuted} />
                </Pressable>
              </View>
              <View style={{ width: 1, height: 16, backgroundColor: colors.border, opacity: 0.65 }} />
              <Pressable
                onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
                accessibilityLabel={t('profile.dark_mode')}
                style={clusterBtn}
              >
                {isDark ? <Sun size={16} color={colors.text} /> : <Moon size={16} color={colors.text} />}
              </Pressable>
              <View style={{ width: 1, height: 16, backgroundColor: colors.border, opacity: 0.65 }} />
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNotifOpen(true);
                }}
                accessibilityLabel={t('notifications.title')}
                style={clusterBtn}
              >
                <View>
                  <Bell size={16} color={colors.text} />
                  {unreadCount > 0 ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -8,
                        minWidth: 16,
                        height: 16,
                        paddingHorizontal: 3,
                        borderRadius: 8,
                        backgroundColor: colors.error,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: isDark ? colors.surface : '#FFFFFF',
                      }}
                    >
                      <RNText
                        style={{
                          fontSize: 9,
                          lineHeight: 11,
                          fontWeight: '700',
                          color: '#FFFFFF',
                          includeFontPadding: false,
                        }}
                      >
                        {formatUnreadBadge(unreadCount)}
                      </RNText>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            </View>
          </View>

          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-start',
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: isDark ? 'rgba(34,211,238,0.18)' : 'rgba(8,145,178,0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                <Stethoscope size={16} color={colors.secondary} strokeWidth={2} />
              </View>
              <RNText
                style={{
                  fontSize: 15,
                  lineHeight: 20,
                  letterSpacing: 0,
                  fontWeight: '700',
                  color: colors.secondary,
                  includeFontPadding: false,
                  paddingRight: 12,
                }}
              >
                DENTA.UZ
              </RNText>
            </View>

            <Text variant="caption" muted style={{ marginBottom: 8 }}>
              {t('home.assalamu_alaykum')}
              {displayName ? `, ${displayName}` : ''}
            </Text>
            <RNText
              style={{
                fontSize: windowWidth < 360 ? 26 : 28,
                lineHeight: windowWidth < 360 ? 34 : 36,
                letterSpacing: -0.4,
                fontFamily: 'Geologica_700Bold',
                color: colors.text,
                includeFontPadding: false,
              }}
            >
              {t('home.hero_title')}
            </RNText>
            <Text variant="body" muted style={{ marginTop: 8, lineHeight: 21, paddingRight: 8 }}>
              {t('home.hero_subtitle')}
            </Text>

            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                goSearch();
              }}
              accessibilityRole="search"
              style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1, marginTop: 18 })}
            >
              <View
                style={[
                  shadows.lg,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    paddingLeft: 16,
                    paddingRight: 6,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: isDark ? colors.border : 'rgba(255,255,255,0.9)',
                  },
                ]}
              >
                <Text
                  variant="body"
                  muted
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ flex: 1, minWidth: 0, marginRight: 8 }}
                >
                  {t('home.search_placeholder')}
                </Text>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Search size={18} color={colors.textInverse} strokeWidth={2.2} />
                </View>
              </View>
            </Pressable>
          </View>
        </LinearGradient>

        {/* ── Shortcuts (single premium row) ──────────────────── */}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: 8, paddingBottom: 6 }}>
          <View style={{ flexDirection: 'row', width: '100%', alignItems: 'flex-start' }}>
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <View key={action.id} style={{ flex: 1, alignItems: 'center' }}>
                  <Pressable
                    onPress={() => {
                      void Haptics.selectionAsync();
                      action.onPress();
                    }}
                    style={({ pressed }) => ({
                      width: '100%',
                      alignItems: 'center',
                      paddingVertical: 6,
                      paddingHorizontal: 2,
                      opacity: pressed ? 0.82 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: colors.primaryMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <Icon size={20} color={colors.primary} strokeWidth={1.9} />
                    </View>
                    <RNText
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        fontSize: windowWidth < 360 ? 10 : windowWidth < 400 ? 11 : 12,
                        lineHeight: windowWidth < 360 ? 14 : windowWidth < 400 ? 15 : 16,
                        letterSpacing: -0.15,
                        fontWeight: '600',
                        color: colors.text,
                        includeFontPadding: false,
                        paddingHorizontal: 1,
                      }}
                    >
                      {action.label}
                    </RNText>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Map centerpiece ────────────────────────────────── */}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <HomeMapCard
            clinics={nearbyPreview}
            openCount={openCount}
            mapType={mapType}
            onMapTypeChange={setMapType}
            onOpenFullMap={goMap}
            onSelectClinic={(id) => {
              void Haptics.selectionAsync();
              router.push(`/(client)/clinic/${id}`);
            }}
            onMapInteractionStart={() => setMapActive(true)}
            onMapInteractionEnd={() => setMapActive(false)}
          />
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
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing['2xl'],
            paddingBottom: 8,
          }}
        >
          <RNText
            style={{
              fontSize: 18,
              lineHeight: 24,
              fontWeight: '700',
              color: colors.text,
              includeFontPadding: false,
              letterSpacing: -0.2,
            }}
          >
            {t('home.trust_title')}
          </RNText>
          <RNText
            style={{
              marginTop: 6,
              marginBottom: 14,
              fontSize: 13,
              lineHeight: 18,
              color: colors.textMuted,
              includeFontPadding: false,
              paddingRight: 8,
            }}
          >
            {t('home.trust_subtitle')}
          </RNText>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              rowGap: 10,
            }}
          >
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <View
                  key={item.id}
                  style={{
                    width: '48.5%',
                    minHeight: 92,
                    borderRadius: 18,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    backgroundColor: isDark ? 'rgba(99,102,241,0.10)' : 'rgba(238,242,255,0.95)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.12)',
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.10)',
                    }}
                  >
                    <Icon size={18} color={colors.primary} strokeWidth={2} />
                  </View>
                  <RNText
                    numberOfLines={2}
                    ellipsizeMode="clip"
                    style={{
                      fontSize: 13,
                      lineHeight: 17,
                      fontWeight: '600',
                      fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
                      color: colors.text,
                      includeFontPadding: false,
                    }}
                  >
                    {item.label}
                  </RNText>
                </View>
              );
            })}
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
            style={[
              languageMenuCardStyle(colors, shadows),
              {
                position: 'absolute',
                top: langPos.top,
                right: langPos.right,
              },
            ]}
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

      <ClientNotificationsCenter visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  );
}
