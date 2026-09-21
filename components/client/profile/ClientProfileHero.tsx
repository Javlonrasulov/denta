import { Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { BadgeCheck, Mail, Pencil, Phone } from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';

export function ClientProfileHero({
  fullName,
  phone,
  email,
  avatarUrl,
  emailPending,
  onEdit,
}: {
  fullName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  emailPending?: boolean;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const { colors, isDark } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 4 } : null;
  const displayName = fullName.trim() || t('profile.guest_name');
  const phoneValue = phone.trim();
  const emailValue = email?.trim() ?? '';
  const secondary = phoneValue || emailValue || t('profile.phone_missing');
  const SecondaryIcon = phoneValue ? Phone : Mail;

  return (
    <Animated.View entering={FadeInDown.duration(340)}>
      <LinearGradient
        colors={
          isDark
            ? (['#1B2150', '#121A2C', '#151D2E'] as const)
            : (['#EEF2FF', '#E8EDFA', '#F4F6FB'] as const)
        }
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={{
          borderRadius: 26,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(165,180,252,0.2)' : 'rgba(67,56,202,0.12)',
          paddingHorizontal: 18,
          paddingTop: 22,
          paddingBottom: 20,
          overflow: 'hidden',
          gap: 16,
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -40,
            right: -20,
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: isDark ? 'rgba(99,102,241,0.16)' : 'rgba(99,102,241,0.09)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -50,
            left: -30,
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: isDark ? 'rgba(45,212,191,0.08)' : 'rgba(45,212,191,0.07)',
          }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              padding: 3,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: isDark ? 'rgba(165,180,252,0.35)' : 'rgba(67,56,202,0.22)',
            }}
          >
            <Avatar uri={avatarUrl} name={displayName} size={72} />
          </View>

          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.05}
              style={{
                fontFamily: 'Geologica_700Bold',
                fontSize: 22,
                lineHeight: 28,
                letterSpacing: -0.4,
                color: colors.text,
                ...androidPad,
              }}
            >
              {displayName}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <SecondaryIcon size={13} color={colors.textMuted} strokeWidth={1.9} />
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.1}
                style={{
                  flex: 1,
                  fontFamily: 'GolosText_500Medium',
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.textSecondary,
                }}
              >
                {secondary}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: isDark ? 'rgba(129,140,248,0.18)' : 'rgba(67,56,202,0.1)',
                }}
              >
                <BadgeCheck size={12} color={colors.primary} strokeWidth={2.1} />
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={1}
                  style={{
                    fontFamily: 'GolosText_600SemiBold',
                    fontSize: 11,
                    lineHeight: 14,
                    color: colors.primary,
                  }}
                >
                  {t('profile.cabinet_badge')}
                </Text>
              </View>

              {emailPending ? (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: isDark ? 'rgba(251,191,36,0.16)' : 'rgba(245,158,11,0.12)',
                  }}
                >
                  <Text
                    numberOfLines={1}
                    maxFontSizeMultiplier={1}
                    style={{
                      fontFamily: 'GolosText_600SemiBold',
                      fontSize: 11,
                      lineHeight: 14,
                      color: isDark ? '#FBBF24' : '#B45309',
                    }}
                  >
                    {t('profile.email_unverified')}
                  </Text>
                </View>
              ) : email ? (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: isDark ? 'rgba(52,211,153,0.14)' : 'rgba(16,185,129,0.12)',
                  }}
                >
                  <Text
                    numberOfLines={1}
                    maxFontSizeMultiplier={1}
                    style={{
                      fontFamily: 'GolosText_600SemiBold',
                      fontSize: 11,
                      lineHeight: 14,
                      color: isDark ? '#34D399' : '#047857',
                    }}
                  >
                    {t('profile.email_verified')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <ScalePressable
          accessibilityLabel={t('profile.edit_profile')}
          onPress={onEdit}
          style={{
            height: 44,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: isDark ? 'rgba(129,140,248,0.18)' : 'rgba(67,56,202,0.12)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(165,180,252,0.28)' : 'rgba(67,56,202,0.18)',
          }}
        >
          <Pencil size={15} color={colors.primary} strokeWidth={2.1} />
          <Text
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 14,
              color: colors.primary,
            }}
          >
            {t('profile.edit_profile')}
          </Text>
        </ScalePressable>
      </LinearGradient>
    </Animated.View>
  );
}
