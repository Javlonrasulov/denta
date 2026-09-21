import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MapPin, Star } from '@/components/icons';
import { useTranslation } from 'react-i18next';

import { BrandMark } from '@/components/brand/BrandMark';
import { Text } from '@/components/ui/Text';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import type { Clinic } from '@/types';
import { formatDistance, formatSom } from '@/utils/slots';

import { clinicDistrict, specLabel } from './searchUtils';

type Props = {
  clinic: Clinic;
  onPress: () => void;
  onDetails: () => void;
  onBook: () => void;
};

function coverUri(clinic: Clinic) {
  return clinic.coverUrl || clinic.photos?.[0] || clinic.logoUrl || '';
}

export function SearchClinicCard({ clinic, onPress, onDetails, onBook }: Props) {
  const { t } = useTranslation();
  const { colors, radius, shadows, isDark } = useTheme();
  const toggleClinic = useFavoritesStore((s) => s.toggleClinic);
  const isFavorite = useFavoritesStore((s) => s.isClinicFavorite(clinic.id));
  const cover = coverUri(clinic);
  const specs = clinic.specializations.filter(Boolean).slice(0, 3);
  const district = clinicDistrict(clinic.address);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={clinic.name}
      style={({ pressed }) => [
        shadows.md,
        {
          backgroundColor: colors.surface,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: isDark ? colors.borderSubtle : 'rgba(15,23,42,0.05)',
          overflow: 'hidden',
          opacity: pressed ? 0.97 : 1,
        },
      ]}
    >
      <View style={{ height: 132, backgroundColor: colors.primaryMuted }}>
        {cover ? (
          <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={180} />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF',
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.82)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BrandMark size={32} />
            </View>
          </View>
        )}

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
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: radius.full,
              backgroundColor: clinic.isOpenNow ? 'rgba(22,163,74,0.94)' : 'rgba(15,23,42,0.72)',
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
              {clinic.isOpenNow ? t('search.open_now') : t('search.closed_now')}
            </Text>
          </View>

          {clinic.distanceKm != null ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: radius.full,
                backgroundColor: 'rgba(255,255,255,0.94)',
              }}
            >
              <MapPin size={11} color={colors.primary} strokeWidth={2.2} />
              <Text variant="caption" weight="semibold" color={colors.text} style={{ fontSize: 11 }}>
                {formatDistance(clinic.distanceKm)}
              </Text>
            </View>
          ) : null}

          <View style={{ flex: 1 }} />

          <Pressable
            onPress={() => toggleClinic(clinic.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('tabs.favorites')}
            style={{
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
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, gap: 8, width: '100%' }}>
        <Text variant="h3" style={{ fontSize: 17, lineHeight: 23, letterSpacing: -0.3 }} numberOfLines={2}>
          {clinic.name}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Star size={13} color={colors.star} fill={colors.star} />
          <Text variant="caption" weight="semibold">
            {clinic.rating.toFixed(1)}
          </Text>
          <Text variant="caption" muted>
            ({clinic.reviewCount})
          </Text>
          <Text variant="caption" muted>
            ·
          </Text>
          <Text variant="caption" muted numberOfLines={1} style={{ flexShrink: 1 }}>
            {district}
          </Text>
        </View>

        {specs.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {specs.map((spec) => (
              <View
                key={spec}
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: radius.full,
                  backgroundColor: colors.secondaryMuted,
                }}
              >
                <Text variant="caption" color={colors.secondary} style={{ fontSize: 11 }}>
                  {specLabel(t, spec)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {clinic.priceFrom > 0 ? (
          <Text variant="label" color={colors.primary} style={{ fontSize: 14 }}>
            {t('home.consult_from', { price: formatSom(clinic.priceFrom) })}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, width: '100%' }}>
          <View
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 44,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <Pressable
              onPress={onDetails}
              android_ripple={{ color: colors.surfaceSoft }}
              style={{
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 8,
              }}
            >
              <Text variant="label" color={colors.text} numberOfLines={1} style={{ fontSize: 13 }}>
                {t('search.details')}
              </Text>
            </Pressable>
          </View>
          <View
            style={{
              flex: 1.45,
              minWidth: 0,
              minHeight: 44,
              borderRadius: 14,
              backgroundColor: colors.primary,
              overflow: 'hidden',
            }}
          >
            <Pressable
              onPress={onBook}
              android_ripple={{ color: colors.primaryPressed }}
              style={{
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 8,
              }}
            >
              <Text variant="label" color={colors.textInverse} numberOfLines={1} style={{ fontSize: 13 }}>
                {t('search.book')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
