import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import type { DoctorProfileStats } from '@/types';

function Cell({ label, value }: { label: string; value: string }) {
  const { colors } = useLoginTheme();
  return (
    <View style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 2 }}>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'Geologica_700Bold',
          fontSize: 16,
          lineHeight: 20,
          color: colors.text,
          ...(Platform.OS === 'android' ? { paddingRight: 2 } : null),
        }}
      >
        {value}
      </Text>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'GolosText_500Medium',
          fontSize: 10,
          lineHeight: 13,
          color: colors.textMuted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function ProfileStats({ stats }: { stats: DoctorProfileStats }) {
  const { t } = useTranslation();
  const { hairline, isDark } = useLoginTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(40)}
      style={{
        backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: hairline,
        paddingVertical: 14,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Cell label={t('doctor_profile.stats_patients')} value={String(stats.patients)} />
      <View style={{ width: 1, height: 28, backgroundColor: hairline }} />
      <Cell label={t('doctor_profile.stats_visits')} value={String(stats.appointments)} />
      <View style={{ width: 1, height: 28, backgroundColor: hairline }} />
      <Cell label={t('doctor_profile.stats_rating')} value={stats.rating.toFixed(1)} />
      <View style={{ width: 1, height: 28, backgroundColor: hairline }} />
      <Cell
        label={t('doctor_profile.stats_exp')}
        value={t('doctor_profile.years_short', { count: stats.experienceYears })}
      />
    </Animated.View>
  );
}
