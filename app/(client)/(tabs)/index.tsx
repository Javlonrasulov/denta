import { useCallback, useRef, useState } from 'react';
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

import {
  Bell,
  CalendarDays,
  ChevronDown,
  Heart,
  MapPin,
  Maximize2,
  Moon,
  RefreshCw,
  Search,
  Stethoscope,
  Sun,
} from '@/components/icons';
import { ClinicCard } from '@/components/clinic/ClinicCard';
import { OsmTileMap } from '@/components/map/OsmTileMap';
import {
  LanguageMenuItems,
  languageMenuCardStyle,
  LOCALE_OPTIONS,
} from '@/components/ui/LanguageMenu';
import { Text } from '@/components/ui/Text';
import { useClinics, usePopularClinics } from '@/hooks/queries';
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
  const { data: popular = [] } = usePopularClinics(6);

  const langBtnRef = useRef<View>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [langPos, setLangPos] = useState({ top: 56, right: 16 });
  const [refreshing, setRefreshing] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [mapActive, setMapActive] = useState(false);

  const currentLocale = LOCALE_OPTIONS.find((item) => item.code === locale) ?? LOCALE_OPTIONS[0];
  const displayName = user.fullName.split(' ')[0] ?? user.fullName;
  const openCount = clinics.filter((c) => c.isOpenNow).length;

  const actions = [
    {
      id: 'search',
      label: t('tabs.search'),
      icon: Search,
      tint: isDark ? 'rgba(251, 191, 36, 0.16)' : '#FFF7ED',
      iconColor: isDark ? '#FBBF24' : '#EA580C',
      onPress: () => router.push('/(client)/(tabs)/search'),
    },
    {
      id: 'book',
      label: t('home.book'),
      icon: CalendarDays,
      tint: isDark ? 'rgba(74, 222, 128, 0.14)' : '#ECFDF5',
      iconColor: isDark ? '#4ADE80' : '#059669',
      onPress: () => router.push('/(client)/(tabs)/search'),
    },
    {
      id: 'doctors',
      label: t('home.top_doctors'),
      icon: Stethoscope,
      tint: isDark ? 'rgba(251, 113, 133, 0.14)' : '#FFF1F2',
      iconColor: isDark ? '#FB7185' : '#E11D48',
      onPress: () => router.push('/(client)/(tabs)/search'),
    },
    {
      id: 'favorites',
      label: t('tabs.favorites'),
      icon: Heart,
      tint: isDark ? 'rgba(129, 140, 248, 0.16)' : '#EEF2FF',
      iconColor: isDark ? '#A5B4FC' : '#4F46E5',
      onPress: () => router.push('/(client)/(tabs)/favorites'),
    },
  ];

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
        removeClippedSubviews={false}
        scrollEnabled={!mapActive}
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

        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Text variant="h3">{t('home.quick_actions')}</Text>
          <View
            style={[
              shadows.sm,
              {
                width: '100%',
                backgroundColor: colors.surface,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                paddingVertical: 16,
                paddingHorizontal: 4,
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              },
            ]}
          >
            {actions.map((action) => {
              const Icon = action.icon;
              // Explicit equal columns — Pressable flex:1 often collapses on Android
              const cellWidth = Math.floor((windowWidth - spacing.xl * 2 - 10) / 4);
              return (
                <View
                  key={action.id}
                  style={{
                    width: cellWidth,
                    alignItems: 'center',
                  }}
                >
                  <Pressable
                    onPress={action.onPress}
                    style={({ pressed }) => ({
                      width: '100%',
                      alignItems: 'center',
                      gap: 8,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 18,
                        backgroundColor: action.tint,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={22} color={action.iconColor} strokeWidth={1.9} />
                    </View>
                    <Text
                      variant="caption"
                      weight="semibold"
                      center
                      numberOfLines={2}
                      style={{
                        fontSize: 11,
                        lineHeight: 14,
                        letterSpacing: 0.1,
                        width: '100%',
                        paddingHorizontal: 2,
                      }}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                </View>
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
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                padding: 16,
                gap: 14,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(129, 140, 248, 0.16)' : '#EEF2FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MapPin size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="h3" numberOfLines={1}>
                  {t('home.clinics_map')}
                </Text>
                <Text variant="caption" muted style={{ marginTop: 2 }} numberOfLines={1}>
                  {t('home.map_subtitle')}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(74, 222, 128, 0.14)' : '#ECFDF5',
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(74, 222, 128, 0.28)' : '#A7F3D0',
                }}
              >
                <Text
                  variant="caption"
                  weight="semibold"
                  color={isDark ? '#4ADE80' : '#059669'}
                >
                  {t('home.open_count', { count: openCount })}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/(client)/map')}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  backgroundColor: colors.surfaceSoft,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Maximize2 size={16} color={colors.text} strokeWidth={2} />
              </Pressable>
            </View>

            <View
              style={{
                height: 260,
                borderRadius: 18,
                overflow: 'hidden',
                backgroundColor: isDark ? '#1E293B' : '#E7E5E4',
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
              onTouchStart={() => setMapActive(true)}
              onTouchEnd={() => setMapActive(false)}
              onTouchCancel={() => setMapActive(false)}
            >
              <OsmTileMap
                clinics={clinics}
                satellite={mapType === 'satellite'}
                onSelectClinic={(id) => router.push(`/(client)/clinic/${id}`)}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 10,
                  bottom: 10,
                  flexDirection: 'row',
                  backgroundColor: isDark ? 'rgba(17, 24, 39, 0.92)' : 'rgba(255,255,255,0.94)',
                  borderRadius: radius.full,
                  padding: 3,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
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

            <View style={{ flexDirection: 'row', gap: spacing.lg, paddingHorizontal: 2 }}>
              {[
                { color: colors.primary, label: t('home.legend_clinics') },
                { color: isDark ? '#4ADE80' : '#059669', label: t('home.legend_open') },
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
