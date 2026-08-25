import { router } from 'expo-router';
import { Bell, MapPin } from '@/components/icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ClinicCard } from '@/components/clinic/ClinicCard';
import { DoctorCard } from '@/components/doctor/DoctorCard';
import {
  MobileHeader,
  MobileIconButton,
  MobileScreen,
  MobileSection,
} from '@/components/mobile';
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

export default function ClientHomeScreen() {
  const { t } = useTranslation();
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
  const firstName = user.fullName?.split(' ')[0] ?? '';

  return (
    <MobileScreen
      padded={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentStyle={{ paddingHorizontal: 0, gap: 0 }}
    >
      <Animated.View
        entering={FadeInDown.duration(320)}
        style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}
      >
        <MobileHeader
          large
          greeting={greeting}
          title={firstName || t('common.app_name')}
          right={
            <>
              <MobileIconButton
                accessibilityLabel="Map"
                onPress={() => router.push('/(client)/map')}
              >
                <Bell size={18} color={colors.textSecondary} strokeWidth={1.8} />
              </MobileIconButton>
              <Pressable onPress={() => router.push('/(client)/(tabs)/profile')}>
                <Avatar uri={user.avatarUrl} name={user.fullName} size={40} />
              </Pressable>
            </>
          }
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <MapPin size={13} color={colors.textMuted} strokeWidth={1.8} />
            <Text variant="caption" muted>
              Toshkent, Chilonzor
            </Text>
          </View>
        </MobileHeader>

        <SearchInput
          value=""
          onChangeText={() => undefined}
          placeholder={t('home.search_placeholder')}
          onFocus={() => router.push('/(client)/(tabs)/search')}
        />
      </Animated.View>

      <View style={{ paddingHorizontal: spacing.xl }}>
        <MobileSection title={t('home.specializations')} style={{ marginBottom: spacing.lg }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {MOCK_SPECIALIZATIONS.slice(0, 8).map((spec) => (
              <Pressable
                key={spec.id}
                onPress={() => router.push('/(client)/(tabs)/search')}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.lg,
                  paddingVertical: 10,
                  borderRadius: radius.full,
                  backgroundColor: pressed ? colors.primaryMuted : colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                })}
              >
                <Text variant="caption" weight="semibold" color={colors.textSecondary}>
                  {t(spec.nameKey, {
                    defaultValue: spec.nameKey.replace('spec.', '').replace(/_/g, ' '),
                  })}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </MobileSection>

        <MobileSection
          title={t('home.nearby_clinics')}
          actionLabel={t('common.see_all')}
          onAction={() => router.push('/(client)/map')}
        >
          {nearby.isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
              <ClinicCardSkeleton />
              <ClinicCardSkeleton />
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
              {nearby.data?.map((clinic) => (
                <ClinicCard
                  key={clinic.id}
                  clinic={clinic}
                  horizontal
                  onPress={() => router.push(`/(client)/clinic/${clinic.id}`)}
                />
              ))}
            </ScrollView>
          )}
        </MobileSection>

        <MobileSection
          title={t('home.top_doctors')}
          actionLabel={t('common.see_all')}
          onAction={() => router.push('/(client)/(tabs)/search')}
        >
          {topDoctors.isLoading ? (
            <ListSkeleton rows={3} />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {topDoctors.data?.slice(0, 4).map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onPress={() => router.push(`/(client)/doctor/${doctor.id}`)}
                />
              ))}
            </View>
          )}
        </MobileSection>

        <MobileSection title={t('home.available_today')}>
          <View style={{ gap: spacing.sm }}>
            {available.data?.slice(0, 3).map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                compact
                onPress={() => router.push(`/(client)/doctor/${doctor.id}`)}
              />
            ))}
          </View>
        </MobileSection>

        <MobileSection title={t('home.popular_clinics')}>
          <View style={{ gap: spacing.md }}>
            {popular.data?.slice(0, 3).map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                onPress={() => router.push(`/(client)/clinic/${clinic.id}`)}
              />
            ))}
          </View>
        </MobileSection>
      </View>
    </MobileScreen>
  );
}
