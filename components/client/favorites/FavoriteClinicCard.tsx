import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Clock, MapPin, Star } from '@/components/icons';
import { useTranslation } from 'react-i18next';

import { BrandMark } from '@/components/brand/BrandMark';
import { clinicDistrict, specLabel } from '@/components/client/search/searchUtils';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import type { Clinic } from '@/types';
import { formatDistance, formatSom } from '@/utils/slots';

import { FavoriteHeart } from './FavoriteHeart';

type SlotHint = { day: 'today' | 'tomorrow'; time: string };

type Props = {
  clinic: Clinic;
  isFavorite: boolean;
  pendingRemoval?: boolean;
  nextSlot?: SlotHint | null;
  onPress: () => void;
  onDetails: () => void;
  onBook: () => void;
  onMap: () => void;
  onToggleFavorite: () => void;
};

function coverUri(clinic: Clinic) {
  return clinic.coverUrl || clinic.photos?.[0] || clinic.logoUrl || '';
}

export function FavoriteClinicCard({
  clinic,
  isFavorite,
  pendingRemoval,
  nextSlot,
  onPress,
  onDetails,
  onBook,
  onMap,
  onToggleFavorite,
}: Props) {
  const { t } = useTranslation();
  const { colors, radius, shadows, isDark } = useTheme();
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
          borderColor: isDark ? colors.borderSubtle : colors.border,
          overflow: 'hidden',
          opacity: pendingRemoval ? 0.72 : pressed ? 0.97 : 1,
        },
      ]}
    >
      <View style={{ height: 148, backgroundColor: colors.primaryMuted }}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={180}
          />
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
          <FavoriteHeart isFavorite={isFavorite} onPress={onToggleFavorite} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, gap: 8 }}>
        <Text
          variant="h3"
          style={{ fontSize: 17, lineHeight: 23, letterSpacing: -0.3 }}
          numberOfLines={2}
        >
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
          {district ? (
            <>
              <Text variant="caption" muted>
                ·
              </Text>
              <Text variant="caption" muted numberOfLines={1} style={{ flexShrink: 1 }}>
                {district}
              </Text>
            </>
          ) : null}
        </View>

        {clinic.address ? (
          <Pressable
            onPress={onMap}
            accessibilityRole="button"
            accessibilityLabel={t('favorites.view_map')}
            hitSlop={4}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}
          >
            <View style={{ marginTop: 2 }}>
              <MapPin size={13} color={colors.secondary} strokeWidth={2} />
            </View>
            <Text
              variant="caption"
              color={colors.textSecondary}
              numberOfLines={2}
              style={{ flex: 1, fontSize: 12, lineHeight: 17 }}
            >
              {clinic.address}
            </Text>
          </Pressable>
        ) : null}

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

        {nextSlot ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 12,
              backgroundColor: colors.successMuted,
            }}
          >
            <Clock size={14} color={colors.success} strokeWidth={2} />
            <Text
              variant="caption"
              color={colors.success}
              weight="semibold"
              style={{ flex: 1 }}
              numberOfLines={1}
            >
              {nextSlot.day === 'today'
                ? t('search.today_slot', { time: nextSlot.time })
                : t('search.tomorrow_slot', { time: nextSlot.time })}
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, width: '100%' }}>
          <ActionButton
            label={t('favorites.details')}
            onPress={onDetails}
            variant="outline"
            flex={1}
            ripple={colors.surfaceSoft}
            textColor={colors.text}
            borderColor={colors.border}
          />
          <ActionButton
            label={t('favorites.book')}
            onPress={onBook}
            variant="solid"
            flex={1.45}
            ripple={colors.primaryPressed}
            textColor={colors.textInverse}
            backgroundColor={colors.primary}
          />
        </View>
      </View>
    </Pressable>
  );
}

function ActionButton({
  label,
  onPress,
  variant,
  flex,
  ripple,
  textColor,
  borderColor,
  backgroundColor,
}: {
  label: string;
  onPress: () => void;
  variant: 'outline' | 'solid';
  flex: number;
  ripple: string;
  textColor: string;
  borderColor?: string;
  backgroundColor?: string;
}) {
  return (
    <View
      style={{
        flex,
        minWidth: 0,
        minHeight: 44,
        borderRadius: 14,
        borderWidth: variant === 'outline' ? 1.5 : 0,
        borderColor,
        backgroundColor,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: ripple }}
        style={{
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 8,
        }}
      >
        <Text variant="label" color={textColor} numberOfLines={1} style={{ fontSize: 13 }}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}
