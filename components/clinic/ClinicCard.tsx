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
  const { colors, spacing, radius, iconSizes, shadows } = useTheme();
  const toggleClinic = useFavoritesStore((s) => s.toggleClinic);
  const isFavorite = useFavoritesStore((s) => s.isClinicFavorite(clinic.id));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={clinic.name}
      style={({ pressed }) => [
        {
          width: horizontal ? 280 : '100%',
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          overflow: 'hidden',
          opacity: pressed ? 0.94 : 1,
          ...shadows.sm,
        },
      ]}
    >
      <View style={{ height: 148, position: 'relative' }}>
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
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.92)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart
            size={iconSizes.sm}
            color={isFavorite ? colors.error : colors.textSecondary}
            fill={isFavorite ? colors.error : 'transparent'}
          />
        </Pressable>
        <View style={{ position: 'absolute', left: spacing.md, bottom: spacing.md }}>
          <Badge
            label={clinic.isOpenNow ? t('clinic.open_now') : t('clinic.closed_now')}
            tone={clinic.isOpenNow ? 'success' : 'neutral'}
          />
        </View>
      </View>

      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <Text variant="h3" numberOfLines={1}>
          {clinic.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Star size={14} color={colors.star} fill={colors.star} />
          <Text variant="bodySmall" weight="semibold">
            {clinic.rating.toFixed(1)}
          </Text>
          <Text variant="bodySmall" muted>
            ({clinic.reviewCount})
          </Text>
          {clinic.distanceKm != null ? (
            <>
              <Text variant="bodySmall" muted>
                ·
              </Text>
              <MapPin size={12} color={colors.textMuted} />
              <Text variant="bodySmall" muted>
                {formatDistance(clinic.distanceKm)}
              </Text>
            </>
          ) : null}
        </View>
        <Text variant="bodySmall" muted numberOfLines={1}>
          {clinic.address}
        </Text>
        <Text variant="caption" color={colors.primary}>
          {t('common.from')} {formatPrice(clinic.priceFrom)} so&apos;m
        </Text>
      </View>
    </Pressable>
  );
}
