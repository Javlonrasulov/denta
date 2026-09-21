import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { Heart } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

type Props = {
  clinicCount: number;
  doctorCount: number;
};

export function FavoritesHeader({ clinicCount, doctorCount }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows, isDark } = useTheme();
  const total = clinicCount + doctorCount;

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <LinearGradient
          colors={
            isDark
              ? ['rgba(244,63,94,0.22)', 'rgba(129,140,248,0.22)']
              : ['#FFE4E6', '#EEF2FF']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            shadows.sm,
            {
              width: 44,
              height: 44,
              borderRadius: radius.xl,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Heart size={20} color="#E11D48" fill="#E11D48" strokeWidth={1.7} />
        </LinearGradient>

        <View style={{ flex: 1, minWidth: 0, gap: 3, paddingTop: 1 }}>
          <Text
            variant="h1"
            style={{ fontSize: 24, lineHeight: 30, letterSpacing: -0.45 }}
            numberOfLines={1}
          >
            {t('favorites.title')}
          </Text>
          <Text variant="bodySmall" muted style={{ lineHeight: 18 }} numberOfLines={2}>
            {t('favorites.subtitle')}
          </Text>
        </View>
      </View>

      {total > 0 ? (
        <Text variant="caption" color={colors.textSecondary} style={{ fontSize: 12, letterSpacing: 0 }}>
          {[
            clinicCount > 0 ? t('favorites.count_clinics', { count: clinicCount }) : null,
            doctorCount > 0 ? t('favorites.count_doctors', { count: doctorCount }) : null,
          ]
            .filter(Boolean)
            .join('  •  ')}
        </Text>
      ) : null}
    </View>
  );
}
