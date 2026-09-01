import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  BadgeCheck,
  Heart,
  MapPin,
  Phone,
  Share2,
  Star,
} from '@/components/icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { DoctorCard } from '@/components/doctor/DoctorCard';
import { ErrorState } from '@/components/states/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useClinic, useDoctors } from '@/hooks/queries';
import { useAppointmentsStore } from '@/store/appointmentsStore';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import { formatDistance, formatPrice } from '@/utils/slots';

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ClinicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, iconSizes, shadows } = useTheme();
  const clinicQuery = useClinic(id);
  const doctorsQuery = useDoctors({ clinicId: id });
  const setDraft = useAppointmentsStore((s) => s.setDraft);
  const toggleClinic = useFavoritesStore((s) => s.toggleClinic);
  const isFavorite = useFavoritesStore((s) => s.isClinicFavorite(id));

  if (clinicQuery.isLoading) return <ListSkeleton rows={6} />;
  if (!clinicQuery.data) {
    return (
      <ErrorState
        title={t('error.something_wrong')}
        onRetry={() => clinicQuery.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  const clinic = clinicQuery.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: 300, position: 'relative' }}>
          <Image
            source={{ uri: clinic.coverUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(15,23,42,0.8)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 160 }}
          />
          <Pressable
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: insets.top + 8,
              left: spacing.lg,
              width: 44,
              height: 44,
              borderRadius: radius.lg,
              backgroundColor: 'rgba(255,255,255,0.95)',
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.sm,
            }}
          >
            <ArrowLeft size={20} color={colors.text} strokeWidth={1.8} />
          </Pressable>
          <View
            style={{
              position: 'absolute',
              top: insets.top + 8,
              right: spacing.lg,
              flexDirection: 'row',
              gap: spacing.sm,
            }}
          >
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleClinic(clinic.id);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.lg,
                backgroundColor: 'rgba(255,255,255,0.95)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Heart
                size={iconSizes.sm}
                color={isFavorite ? colors.error : colors.text}
                fill={isFavorite ? colors.error : 'transparent'}
              />
            </Pressable>
            <Pressable
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.lg,
                backgroundColor: 'rgba(255,255,255,0.95)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Share2 size={18} color={colors.text} />
            </Pressable>
          </View>
          <View
            style={{
              position: 'absolute',
              left: spacing.xl,
              right: spacing.xl,
              bottom: spacing.xl,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="h1" color={colors.textInverse} style={{ flex: 1 }}>
                {clinic.name}
              </Text>
              <BadgeCheck color={colors.secondary} size={22} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Star size={14} color={colors.star} fill={colors.star} />
              <Text variant="bodySmall" color={colors.textInverse}>
                {clinic.rating.toFixed(1)} · {clinic.reviewCount}{' '}
                {t('clinic.reviews').toLowerCase()}
              </Text>
              {clinic.distanceKm != null ? (
                <Text variant="bodySmall" color={colors.textInverse}>
                  · {formatDistance(clinic.distanceKm)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={{ padding: spacing.xl, gap: spacing.xl }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Badge
              label={clinic.isOpenNow ? t('clinic.open_now') : t('clinic.closed_now')}
              tone={clinic.isOpenNow ? 'success' : 'neutral'}
            />
            <Badge label="Verified" tone="secondary" />
          </View>

          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <MapPin size={16} color={colors.textMuted} />
              <Text variant="body" muted style={{ flex: 1 }}>
                {clinic.address}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <Phone size={16} color={colors.textMuted} />
              <Text variant="body" muted>
                {clinic.phone}
              </Text>
            </View>
          </View>

          <View>
            <Text variant="h3" style={{ marginBottom: spacing.sm }}>
              {t('clinic.services')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {clinic.specializations.map((spec) => (
                  <View
                    key={spec}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: radius.full,
                      backgroundColor: colors.primaryMuted,
                    }}
                  >
                    <Text variant="caption" style={{ color: colors.primary, fontWeight: '600' }}>
                      {spec}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View>
            <Text variant="h3" style={{ marginBottom: spacing.sm }}>
              {t('clinic.about')}
            </Text>
            <Text variant="body" muted>
              {clinic.about}
            </Text>
          </View>

          <View>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>
              {t('clinic.doctors')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                {doctorsQuery.data?.map((doctor) => (
                  <View key={doctor.id} style={{ width: 260 }}>
                    <DoctorCard
                      doctor={doctor}
                      onPress={() => router.push(`/(client)/doctor/${doctor.id}`)}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View>
            <Text variant="h3" style={{ marginBottom: spacing.sm }}>
              {t('clinic.working_hours')}
            </Text>
            {clinic.workingHours.map((h) => (
              <View
                key={h.day}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                }}
              >
                <Text variant="bodySmall">{DAY_KEYS[h.day]}</Text>
                <Text variant="bodySmall" muted>
                  {h.closed ? '—' : `${h.open}–${h.close}`}
                </Text>
              </View>
            ))}
          </View>

          {clinic.photos.length > 0 && (
            <View>
              <Text variant="h3" style={{ marginBottom: spacing.md }}>
                {t('clinic.photos')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {clinic.photos.map((uri) => (
                    <Image
                      key={uri}
                      source={{ uri }}
                      style={{
                        width: 160,
                        height: 120,
                        borderRadius: radius.lg,
                        backgroundColor: colors.skeleton,
                      }}
                      contentFit="cover"
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <Text variant="caption" style={{ color: colors.primary }}>
            {t('common.from')} {formatPrice(clinic.priceFrom)} so&apos;m
          </Text>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing.md,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
        }}
      >
        <Button
          title={t('clinic.book_appointment')}
          fullWidth
          size="lg"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setDraft({ clinicId: clinic.id });
            router.push({ pathname: '/(client)/booking', params: { clinicId: clinic.id } });
          }}
        />
      </View>
    </View>
  );
}
