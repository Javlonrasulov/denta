import React from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MapPin, Star } from '@/components/icons';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import { Clinic } from '@/types';
import { formatDistance, formatPrice } from '@/utils/slots';

interface ClinicCardProps {
  clinic: Clinic;
  onPress?: () => void;
  horizontal?: boolean;
}

export function ClinicCard({ clinic, onPress, horizontal }: ClinicCardProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, iconSizes } = useTheme();
  const toggleClinic = useFavoritesStore((s) => s.toggleClinic);
  const isFavorite = useFavoritesStore((s) => s.isClinicFavorite(clinic.id));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={clinic.name}
      style={({ pressed }) => [
        {
          width: horizontal ? 260 : '100%',
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          overflow: 'hidden',
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <View style={{ height: horizontal ? 128 : 140, position: 'relative' }}>
        <Image
          source={{ uri: clinic.coverUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />
        <Pressable
          onPress={() => toggleClinic(clinic.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Favorite"
          style={{
            position: 'absolute',
            top: spacing.md,
            right: spacing.md,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.95)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart
            size={iconSizes.sm}
            color={isFavorite ? colors.error : colors.textSecondary}
            fill={isFavorite ? colors.error : 'transparent'}
            strokeWidth={1.8}
          />
        </Pressable>
        <View style={{ position: 'absolute', left: spacing.md, bottom: spacing.md }}>
          <Badge
            label={clinic.isOpenNow ? t('clinic.open_now') : t('clinic.closed_now')}
            tone={clinic.isOpenNow ? 'success' : 'neutral'}
          />
        </View>
      </View>

      <View style={{ padding: spacing.lg, gap: 6 }}>
        <Text variant="label" numberOfLines={1} style={{ fontSize: 15, letterSpacing: -0.2 }}>
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
          {clinic.distanceKm != null ? (
            <>
              <Text variant="caption" muted>
                ·
              </Text>
              <MapPin size={11} color={colors.textMuted} />
              <Text variant="caption" muted>
                {formatDistance(clinic.distanceKm)}
              </Text>
            </>
          ) : null}
        </View>
        <Text variant="caption" muted numberOfLines={1}>
          {clinic.address}
        </Text>
        <Text variant="caption" weight="semibold" color={colors.primary} style={{ marginTop: 2 }}>
          {t('common.from')} {formatPrice(clinic.priceFrom)}
        </Text>
      </View>
    </Pressable>
  );
}
