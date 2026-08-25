import React from 'react';
import { Pressable, View } from 'react-native';
import { Heart, Star } from '@/components/icons';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import { Doctor } from '@/types';
import { formatPrice } from '@/utils/slots';

interface DoctorCardProps {
  doctor: Doctor;
  clinicName?: string;
  onPress?: () => void;
  compact?: boolean;
}

export function DoctorCard({ doctor, clinicName, onPress, compact }: DoctorCardProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, iconSizes } = useTheme();
  const toggleDoctor = useFavoritesStore((s) => s.toggleDoctor);
  const isFavorite = useFavoritesStore((s) => s.isDoctorFavorite(doctor.id));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={doctor.fullName}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: compact ? spacing.md : spacing.lg,
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <Avatar uri={doctor.photoUrl} name={doctor.fullName} size={compact ? 48 : 56} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text variant="label" numberOfLines={1} style={{ fontSize: 15, letterSpacing: -0.2 }}>
          {doctor.fullName}
        </Text>
        <Text variant="caption" color={colors.secondary} numberOfLines={1}>
          {doctor.specialization}
        </Text>
        {clinicName ? (
          <Text variant="caption" muted numberOfLines={1}>
            {t('doctor.at_clinic', { clinic: clinicName })}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2, flexWrap: 'wrap' }}>
          <Star size={11} color={colors.star} fill={colors.star} />
          <Text variant="caption" weight="semibold">
            {doctor.rating.toFixed(1)}
          </Text>
          <Text variant="caption" muted>
            · {t('doctor.experience_years', { years: doctor.experienceYears })}
          </Text>
          <Text variant="caption" muted>
            · {t('common.from')} {formatPrice(doctor.priceFrom)}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => toggleDoctor(doctor.id)}
        hitSlop={10}
        accessibilityRole="button"
        style={{
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.md,
        }}
      >
        <Heart
          size={iconSizes.sm}
          color={isFavorite ? colors.error : colors.textMuted}
          fill={isFavorite ? colors.error : 'transparent'}
          strokeWidth={1.8}
        />
      </Pressable>
    </Pressable>
  );
}
