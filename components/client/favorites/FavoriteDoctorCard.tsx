import { Pressable, View } from 'react-native';
import { Clock, Star } from '@/components/icons';
import { useTranslation } from 'react-i18next';

import { doctorSpecLabel } from '@/components/client/search/searchUtils';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import type { Clinic, Doctor } from '@/types';
import { formatSom } from '@/utils/slots';

import { FavoriteHeart } from './FavoriteHeart';

type SlotHint = { day: 'today' | 'tomorrow'; time: string };

type Props = {
  doctor: Doctor;
  clinic?: Clinic;
  isFavorite: boolean;
  pendingRemoval?: boolean;
  nextSlot?: SlotHint | null;
  onPress: () => void;
  onProfile: () => void;
  onBook: () => void;
  onToggleFavorite: () => void;
};

export function FavoriteDoctorCard({
  doctor,
  clinic,
  isFavorite,
  pendingRemoval,
  nextSlot,
  onPress,
  onProfile,
  onBook,
  onToggleFavorite,
}: Props) {
  const { t } = useTranslation();
  const { colors, shadows, isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={doctor.fullName}
      style={({ pressed }) => [
        shadows.md,
        {
          backgroundColor: colors.surface,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: isDark ? colors.borderSubtle : colors.border,
          padding: 16,
          gap: 12,
          opacity: pendingRemoval ? 0.72 : pressed ? 0.97 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Avatar uri={doctor.photoUrl} name={doctor.fullName} size={76} />
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text
            variant="h3"
            style={{ fontSize: 16, lineHeight: 22, letterSpacing: -0.25 }}
            numberOfLines={2}
          >
            {doctor.fullName}
          </Text>
          <Text variant="caption" color={colors.secondary} numberOfLines={2} style={{ fontSize: 13 }}>
            {doctorSpecLabel(t, doctor.specialization)}
          </Text>
          {clinic?.name ? (
            <Text variant="caption" muted numberOfLines={2}>
              {clinic.name}
            </Text>
          ) : null}
        </View>
        <FavoriteHeart isFavorite={isFavorite} onPress={onToggleFavorite} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <Star size={13} color={colors.star} fill={colors.star} />
        <Text variant="caption" weight="semibold">
          {doctor.rating.toFixed(1)}
        </Text>
        <Text variant="caption" muted>
          ({doctor.reviewCount})
        </Text>
        {doctor.experienceYears > 0 ? (
          <>
            <Text variant="caption" muted>
              ·
            </Text>
            <Text variant="caption" muted>
              {t('search.experience_line', { years: doctor.experienceYears })}
            </Text>
          </>
        ) : null}
      </View>

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
            numberOfLines={2}
          >
            {nextSlot.day === 'today'
              ? t('search.today_slot', { time: nextSlot.time })
              : t('search.tomorrow_slot', { time: nextSlot.time })}
          </Text>
        </View>
      ) : null}

      {doctor.priceFrom > 0 ? (
        <Text variant="label" color={colors.primary} style={{ fontSize: 14 }}>
          {t('home.consult_from', { price: formatSom(doctor.priceFrom) })}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
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
            onPress={onProfile}
            android_ripple={{ color: colors.surfaceSoft }}
            style={{
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 8,
            }}
          >
            <Text variant="label" color={colors.text} numberOfLines={1} style={{ fontSize: 13 }}>
              {t('favorites.profile')}
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
              {t('favorites.book')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
