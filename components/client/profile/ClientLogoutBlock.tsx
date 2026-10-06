import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { LogOut } from '@/components/icons';
import { Text } from '@/components/ui/Text';

export function ClientLogoutBlock({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { colors, isDark } = useLoginTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(120).duration(320)}
      style={{ gap: 10, paddingTop: 8 }}
    >
      <ScalePressable
        accessibilityLabel={t('profile.logout_cta')}
        onPress={onPress}
        style={{
          height: 56,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(251,113,133,0.32)' : 'rgba(220,38,38,0.22)',
          backgroundColor: isDark ? '#151D2E' : '#FFFFFF',
          shadowColor: '#DC2626',
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: isDark ? 0 : 2,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(251,113,133,0.16)' : 'rgba(239,68,68,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={16} color={colors.error} strokeWidth={2.1} />
          </View>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.1}
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 15,
              lineHeight: 20,
              color: colors.error,
            }}
          >
            {t('profile.logout_cta')}
          </Text>
        </View>
      </ScalePressable>

      <Text
        center
        maxFontSizeMultiplier={1.1}
        style={{
          fontFamily: 'GolosText_400Regular',
          fontSize: 12,
          lineHeight: 16,
          color: colors.textMuted,
          paddingHorizontal: 16,
        }}
      >
        {t('profile.logout_subtitle')}
      </Text>
    </Animated.View>
  );
}
