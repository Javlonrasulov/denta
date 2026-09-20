import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';
import type { DoctorProfileCompletion } from '@/types';

export function ProfileCompletion({
  completion,
}: {
  completion: DoctorProfileCompletion;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();
  const done = completion.percent >= 100;

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(20)}
      style={{
        backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: hairline,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text
          style={{
            fontFamily: 'GolosText_600SemiBold',
            fontSize: 13,
            lineHeight: 18,
            color: colors.text,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {done ? t('doctor_profile.completion_done') : t('doctor_profile.completion')}
        </Text>
        <Text
          style={{
            fontFamily: 'Geologica_700Bold',
            fontSize: 18,
            lineHeight: 22,
            letterSpacing: -0.3,
            color: colors.primary,
          }}
        >
          {completion.percent}%
        </Text>
      </View>
      <View
        style={{
          height: 7,
          borderRadius: 4,
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={isDark ? (['#818CF8', '#6366F1'] as const) : (['#6366F1', '#4338CA'] as const)}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            width: `${Math.max(completion.percent, 4)}%`,
            height: '100%',
            borderRadius: 4,
          }}
        />
      </View>
      {!done ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          <Text
            style={{
              fontFamily: 'GolosText_400Regular',
              fontSize: 12,
              lineHeight: 16,
              color: colors.textMuted,
            }}
          >
            {t('doctor_profile.missing')}
          </Text>
          {completion.missing.map((key) => (
            <View
              key={key}
              style={{
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 9,
                backgroundColor: isDark ? 'rgba(129,140,248,0.14)' : 'rgba(67,56,202,0.08)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(165,180,252,0.16)' : 'rgba(67,56,202,0.1)',
              }}
            >
              <Text
                style={{
                  fontFamily: 'GolosText_500Medium',
                  fontSize: 11,
                  lineHeight: 14,
                  color: colors.primary,
                }}
              >
                {t(`doctor_profile.missing_${key}`)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}
