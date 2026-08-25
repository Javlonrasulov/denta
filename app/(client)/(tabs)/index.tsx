import { router } from 'expo-router';
import { Bell, MapPin, ChevronRight } from '@/components/icons';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  View,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ClinicCard } from '@/components/clinic/ClinicCard';
import { DoctorCard } from '@/components/doctor/DoctorCard';
import { Avatar } from '@/components/ui/Avatar';
import { SearchInput } from '@/components/ui/Input';
import { ClinicCardSkeleton, ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import {
  useAvailableTodayDoctors,
  useNearbyClinics,
  usePopularClinics,
  useTopDoctors,
} from '@/hooks/queries';
import { MOCK_SPECIALIZATIONS } from '@/mocks/data';
import { useUserStore } from '@/store/userStore';
import { useTheme } from '@/theme';

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'home.good_morning';
  if (h < 18) return 'home.good_afternoon';
  return 'home.good_evening';
}

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
      }}
    >
      <Text variant="h3">{title}</Text>
      {onSeeAll ? (
        <Pressable
          onPress={onSeeAll}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
        >
          <Text variant="label" color={colors.primary}>
            {t('common.see_all')}
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function ClientHomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const user = useUserStore();

  const nearby = useNearbyClinics(6);
  const popular = usePopularClinics(6);
  const topDoctors = useTopDoctors(6);
  const available = useAvailableTodayDoctors(6);

  const refreshing = nearby.isRefetching || topDoctors.isRefetching;
  const onRefresh = () => {
    void nearby.refetch();
    void popular.refetch();
    void topDoctors.refetch();
    void available.refetch();
  };

  const greeting = useMemo(() => t(greetingKey()), [t]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing['5xl'] }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View
          style={{
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.lg,
            gap: spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
              <MapPin size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text variant="caption" muted>
                  {greeting}
                </Text>
                <Text variant="label" numberOfLines={1}>
                  Toshkent, Chilonzor
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Pressable
                onPress={() => router.push('/(client)/map')}
                accessibilityRole="button"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Bell size={20} color={colors.text} />
              </Pressable>
              <Pressable onPress={() => router.push('/(client)/(tabs)/profile')}>
                <Avatar uri={user.avatarUrl} name={user.fullName} size={44} />
              </Pressable>
            </View>
          </View>

          <Animated.View entering={FadeInDown.springify()}>
            <Text variant="h1" color={colors.primary} style={{ marginBottom: spacing.xs }}>
              {t('common.app_name')}
            </Text>
            <Text variant="caption" muted style={{ marginBottom: spacing.sm }}>
              {t('common.tagline')}
            </Text>
            <SearchInput
              value=""
              onChangeText={() => undefined}
              placeholder={t('home.search_placeholder')}
              onFocus={() => router.push('/(client)/(tabs)/search')}
            />
          </Animated.View>
        </View>

        <View style={{ marginBottom: spacing['2xl'] }}>
          <SectionHeader title={t('home.specializations')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}
          >
            {MOCK_SPECIALIZATIONS.map((spec) => (
              <Pressable
                key={spec.id}
                onPress={() => router.push('/(client)/(tabs)/search')}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderRadius: radius.full,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text variant="label" color={colors.textSecondary}>
                  {spec.nameKey.replace('spec.', '').replace(/_/g, ' ')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginBottom: spacing['2xl'] }}>
          <SectionHeader
            title={t('home.nearby_clinics')}
            onSeeAll={() => router.push('/(client)/map')}
          />
          {nearby.isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
              <ClinicCardSkeleton />
              <ClinicCardSkeleton />
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
            >
              {nearby.data?.map((clinic, i) => (
                <ClinicCard
                  key={clinic.id}
                  clinic={clinic}
                  horizontal
                  onPress={() => router.push(`/(client)/clinic/${clinic.id}`)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        <View style={{ marginBottom: spacing['2xl'] }}>
          <SectionHeader
            title={t('home.top_doctors')}
            onSeeAll={() => router.push('/(client)/(tabs)/search')}
          />
          {topDoctors.isLoading ? (
            <ListSkeleton rows={3} />
          ) : (
            <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
              {topDoctors.data?.slice(0, 4).map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onPress={() => router.push(`/(client)/doctor/${doctor.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ marginBottom: spacing['2xl'] }}>
          <SectionHeader title={t('home.available_today')} />
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
            {available.data?.slice(0, 3).map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                compact
                onPress={() => router.push(`/(client)/doctor/${doctor.id}`)}
              />
            ))}
          </View>
        </View>

        <View>
          <SectionHeader title={t('home.popular_clinics')} />
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
            {popular.data?.slice(0, 3).map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                onPress={() => router.push(`/(client)/clinic/${clinic.id}`)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
