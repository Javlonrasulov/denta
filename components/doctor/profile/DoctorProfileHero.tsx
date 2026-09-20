import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Star } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { DoctorProfile } from '@/types';
import { DoctorAvatar } from './DoctorAvatar';

function MetaChip({ label }: { label: string }) {
  const { colors, isDark } = useLoginTheme();
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)',
        maxWidth: '100%',
      }}
    >
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'GolosText_500Medium',
          fontSize: 12,
          lineHeight: 16,
          color: colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function DoctorProfileHero({
  profile,
  onAvatar,
}: {
  profile: DoctorProfile;
  onAvatar: () => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 4 } : null;

  return (
    <Animated.View
      entering={FadeInDown.duration(320)}
      style={{
        borderRadius: 24,
        borderWidth: 1,
        borderColor: hairline,
        backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
        paddingHorizontal: 18,
        paddingVertical: 22,
        alignItems: 'center',
        gap: 10,
      }}
    >
      <DoctorAvatar
        uri={profile.avatar}
        firstName={profile.firstName}
        lastName={profile.lastName}
        onPress={onAvatar}
      />
      <View style={{ alignItems: 'center', gap: 4, width: '100%', paddingTop: 4 }}>
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.05}
          style={{
            fontFamily: 'Geologica_700Bold',
            fontSize: 26,
            lineHeight: 32,
            letterSpacing: -0.45,
            color: colors.text,
            textAlign: 'center',
            ...androidPad,
          }}
        >
          {profile.fullName}
        </Text>
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.1}
          style={{
            fontFamily: 'GolosText_500Medium',
            fontSize: 14,
            lineHeight: 20,
            color: colors.textSecondary,
          }}
        >
          {profile.specialty}
        </Text>
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.1}
          style={{
            fontFamily: 'GolosText_400Regular',
            fontSize: 13,
            lineHeight: 18,
            color: colors.textMuted,
          }}
        >
          {profile.clinicName}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
          marginTop: 4,
        }}
      >
        <MetaChip label={t('doctor_profile.years_exp', { count: profile.experienceYears })} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 10,
            backgroundColor: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(245,158,11,0.12)',
          }}
        >
          <Star size={12} color={colors.star} strokeWidth={2.2} fill={colors.star} />
          <Text
            maxFontSizeMultiplier={1}
            style={{
              fontFamily: 'Geologica_600SemiBold',
              fontSize: 12,
              lineHeight: 16,
              color: colors.text,
            }}
          >
            {profile.rating.toFixed(1)}
          </Text>
        </View>
        <MetaChip label={`${t('doctor_profile.doctor_id')}: ${profile.displayId}`} />
      </View>
    </Animated.View>
  );
}
