import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Building2, Star } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import type { DoctorProfile } from '@/types';
import { DoctorAvatar } from './DoctorAvatar';

function MetaChip({
  children,
  accent,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  const { isDark } = useLoginTheme();
  return (
    <View
      style={{
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 12,
        backgroundColor: accent
          ? isDark
            ? 'rgba(251,191,36,0.14)'
            : 'rgba(245,158,11,0.12)'
          : isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.78)',
        borderWidth: 1,
        borderColor: accent
          ? isDark
            ? 'rgba(251,191,36,0.22)'
            : 'rgba(245,158,11,0.18)'
          : isDark
            ? 'rgba(148,163,184,0.12)'
            : 'rgba(15,23,42,0.06)',
        maxWidth: '100%',
      }}
    >
      {children}
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
  const { colors, isDark } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 4 } : null;

  return (
    <Animated.View entering={FadeInDown.duration(340)}>
      <LinearGradient
        colors={
          isDark ? (['#1B2150', '#121A2C', '#151D2E'] as const) : (['#EEF2FF', '#E8EDFA', '#F4F6FB'] as const)
        }
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={{
          borderRadius: 26,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(165,180,252,0.2)' : 'rgba(67,56,202,0.12)',
          paddingHorizontal: 18,
          paddingTop: 26,
          paddingBottom: 22,
          alignItems: 'center',
          gap: 12,
          overflow: 'hidden',
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -36,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.1)',
          }}
        />

        <DoctorAvatar
          uri={profile.avatar}
          firstName={profile.firstName}
          lastName={profile.lastName}
          size={118}
          onPress={onAvatar}
        />

        <View style={{ alignItems: 'center', gap: 6, width: '100%', paddingTop: 2 }}>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.05}
            style={{
              fontFamily: 'Geologica_700Bold',
              fontSize: 27,
              lineHeight: 33,
              letterSpacing: -0.55,
              color: colors.text,
              textAlign: 'center',
              ...androidPad,
            }}
          >
            {profile.fullName}
          </Text>

          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: isDark ? 'rgba(129,140,248,0.18)' : 'rgba(67,56,202,0.1)',
            }}
          >
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.05}
              style={{
                fontFamily: 'GolosText_600SemiBold',
                fontSize: 13,
                lineHeight: 17,
                color: colors.primary,
              }}
            >
              {profile.specialty}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Building2 size={13} color={colors.textMuted} strokeWidth={1.9} />
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.1}
              style={{
                fontFamily: 'GolosText_500Medium',
                fontSize: 13,
                lineHeight: 18,
                color: colors.textSecondary,
              }}
            >
              {profile.clinicName}
            </Text>
          </View>
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
          <MetaChip>
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
              {t('doctor_profile.years_exp', { n: profile.experienceYears })}
            </Text>
          </MetaChip>

          <MetaChip accent>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
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
          </MetaChip>

          <MetaChip>
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
              {t('doctor_profile.doctor_id')}: {profile.displayId}
            </Text>
          </MetaChip>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
