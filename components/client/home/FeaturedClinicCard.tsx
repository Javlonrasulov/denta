import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Heart, MapPin, Star } from '@/components/icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import type { Clinic } from '@/types';
import { formatDistance, formatPrice } from '@/utils/slots';

type Props = {
  clinic: Clinic;
  width: number;
  onPress: () => void;
};

function coverUri(clinic: Clinic) {
  return clinic.coverUrl || clinic.photos?.[0] || clinic.logoUrl || '';
}

export function FeaturedClinicCard({ clinic, width, onPress }: Props) {
  const { t } = useTranslation();
  const { colors, radius, shadows, isDark } = useTheme();
  const toggleClinic = useFavoritesStore((s) => s.toggleClinic);
  const isFavorite = useFavoritesStore((s) => s.isClinicFavorite(clinic.id));
  const cover = coverUri(clinic);
  const specs = clinic.specializations.filter(Boolean).slice(0, 2);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={clinic.name}
      style={({ pressed }) => [
        shadows.md,
        {
          width,
          backgroundColor: colors.surface,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          overflow: 'hidden',
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      <View style={{ height: 168, backgroundColor: colors.primaryMuted }}>
        {cover ? (
          <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={isDark ? ['#312E81', '#155E75'] : ['#A5B4FC', '#67E8F9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Building2 size={28} color={isDark ? '#C7D2FE' : '#312E81'} strokeWidth={1.5} />
            <Text
              variant="h2"
              color={isDark ? '#E0E7FF' : '#312E81'}
              style={{ marginTop: 8, letterSpacing: -0.4 }}
              numberOfLines={1}
            >
              {clinic.name.slice(0, 1)}
            </Text>
          </LinearGradient>
        )}
        <LinearGradient
          colors={['rgba(15,23,42,0.05)', 'rgba(15,23,42,0.55)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 88 }}
        />
        <Pressable
          onPress={() => toggleClinic(clinic.id)}
          hitSlop={8}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.96)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart
            size={16}
            color={isFavorite ? colors.error : colors.textSecondary}
            fill={isFavorite ? colors.error : 'transparent'}
            strokeWidth={1.8}
          />
        </Pressable>
        <View
          style={{
            position: 'absolute',
            left: 12,
            top: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: radius.full,
            backgroundColor: clinic.isOpenNow ? 'rgba(22,163,74,0.92)' : 'rgba(15,23,42,0.72)',
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#FFFFFF',
            }}
          />
          <Text variant="caption" color="#FFFFFF" weight="semibold" style={{ fontSize: 11 }}>
            {clinic.isOpenNow ? t('clinic.open_now') : t('clinic.closed_now')}
          </Text>
        </View>
        {clinic.distanceKm != null ? (
          <View
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 5,
              borderRadius: radius.full,
              backgroundColor: 'rgba(255,255,255,0.94)',
            }}
          >
            <MapPin size={11} color={colors.primary} />
            <Text variant="caption" weight="semibold" style={{ fontSize: 11 }}>
              {formatDistance(clinic.distanceKm)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14, gap: 7 }}>
        <Text variant="label" numberOfLines={1} style={{ fontSize: 16, letterSpacing: -0.3 }}>
          {clinic.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Star size={13} color={colors.star} fill={colors.star} />
          <Text variant="caption" weight="semibold">
            {clinic.rating.toFixed(1)}
          </Text>
          <Text variant="caption" muted>
            ({clinic.reviewCount})
          </Text>
        </View>
        <Text variant="caption" muted numberOfLines={1}>
          {clinic.address}
        </Text>
        {specs.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {specs.map((spec) => (
              <View
                key={spec}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: radius.full,
                  backgroundColor: colors.secondaryMuted,
                  maxWidth: width / 2 - 20,
                }}
              >
                <Text variant="caption" color={colors.secondary} numberOfLines={1} style={{ fontSize: 10 }}>
                  {spec}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <Text variant="caption" weight="semibold" color={colors.primary}>
          {t('home.consult_from', { price: formatPrice(clinic.priceFrom) })}
        </Text>
      </View>
    </Pressable>
  );
}
