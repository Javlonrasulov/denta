import { Pressable, View } from 'react-native';
import { Heart, Star } from '@/components/icons';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import type { Doctor } from '@/types';
import { formatPrice } from '@/utils/slots';

type Props = {
  doctor: Doctor;
  clinicName?: string;
  width: number;
  onPress: () => void;
};

export function FeaturedDoctorCard({ doctor, clinicName, width, onPress }: Props) {
  const { t } = useTranslation();
  const { colors, radius, shadows } = useTheme();
  const toggleDoctor = useFavoritesStore((s) => s.toggleDoctor);
  const isFavorite = useFavoritesStore((s) => s.isDoctorFavorite(doctor.id));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={doctor.fullName}
      style={({ pressed }) => [
        shadows.md,
        {
          width,
          padding: 14,
          backgroundColor: colors.surface,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          opacity: pressed ? 0.96 : 1,
          gap: 12,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Avatar uri={doctor.photoUrl} name={doctor.fullName} size={64} />
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text variant="label" numberOfLines={1} style={{ fontSize: 16, letterSpacing: -0.25 }}>
            {doctor.fullName}
          </Text>
          <Text variant="caption" color={colors.secondary} numberOfLines={1}>
            {doctor.specialization}
          </Text>
          {clinicName ? (
            <Text variant="caption" muted numberOfLines={1}>
              {clinicName}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => toggleDoctor(doctor.id)}
          hitSlop={8}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.surfaceSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart
            size={15}
            color={isFavorite ? colors.error : colors.textMuted}
            fill={isFavorite ? colors.error : 'transparent'}
            strokeWidth={1.8}
          />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Star size={12} color={colors.star} fill={colors.star} />
          <Text variant="caption" weight="semibold">
            {doctor.rating.toFixed(1)}
          </Text>
          <Text variant="caption" muted>
            ({doctor.reviewCount})
          </Text>
        </View>
        <Text variant="caption" muted>
          · {t('home.experience_short', { years: doctor.experienceYears })}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="caption" muted numberOfLines={1}>
            {t('home.consultation')}
          </Text>
          <Text variant="label" color={colors.primary} numberOfLines={1}>
            {formatPrice(doctor.priceFrom)}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: radius.full,
            backgroundColor: colors.primary,
          }}
        >
          <Text variant="caption" weight="semibold" color={colors.textInverse}>
            {t('home.book_cta')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
