import { Pressable, View } from 'react-native';
import { Clock, Heart, Star } from '@/components/icons';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { useFavoritesStore } from '@/store/userStore';
import { useTheme } from '@/theme';
import type { Clinic, Doctor } from '@/types';
import { formatSom } from '@/utils/slots';

import { doctorSpecLabel, nextSlotHint } from './searchUtils';

type Props = {
  doctor: Doctor;
  clinic?: Clinic;
  onPress: () => void;
  onView: () => void;
  onBook: () => void;
};

export function SearchDoctorCard({ doctor, clinic, onPress, onView, onBook }: Props) {
  const { t } = useTranslation();
  const { colors, shadows, isDark } = useTheme();
  const toggleDoctor = useFavoritesStore((s) => s.toggleDoctor);
  const isFavorite = useFavoritesStore((s) => s.isDoctorFavorite(doctor.id));
  const slot = nextSlotHint(doctor);

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
          borderColor: isDark ? colors.borderSubtle : 'rgba(15,23,42,0.05)',
          padding: 16,
          gap: 12,
          opacity: pressed ? 0.97 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Avatar uri={doctor.photoUrl} name={doctor.fullName} size={72} />
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text variant="h3" style={{ fontSize: 16, lineHeight: 22, letterSpacing: -0.25 }} numberOfLines={2}>
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
        <Pressable
          onPress={() => toggleDoctor(doctor.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('tabs.favorites')}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surfaceSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Heart
            size={16}
            color={isFavorite ? colors.error : colors.textMuted}
            fill={isFavorite ? colors.error : 'transparent'}
            strokeWidth={1.8}
          />
        </Pressable>
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
        <Text variant="caption" color={colors.success} weight="semibold" style={{ flex: 1 }} numberOfLines={2}>
          {slot.day === 'today'
            ? t('search.today_slot', { time: slot.time })
            : t('search.tomorrow_slot', { time: slot.time })}
        </Text>
      </View>

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
            onPress={onView}
            android_ripple={{ color: colors.surfaceSoft }}
            style={{
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 8,
            }}
          >
            <Text variant="label" color={colors.text} numberOfLines={1} style={{ fontSize: 13 }}>
              {t('search.view_doctor')}
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
    </Pressable>
  );
}
