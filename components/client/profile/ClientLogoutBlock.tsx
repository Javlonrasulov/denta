import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { LogOut } from '@/components/icons';
import { Text } from '@/components/ui/Text';

export function ClientLogoutBlock({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { colors, isDark } = useLoginTheme();

  return (
    <Animated.View entering={FadeInDown.delay(120).duration(320)} style={{ gap: 8 }}>
      <Text
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1.2,
          color: colors.textMuted,
          textTransform: 'uppercase',
          paddingHorizontal: 4,
        }}
      >
        {t('profile.section_session')}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('profile.logout')}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={({ pressed }) => ({
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(251,113,133,0.28)' : 'rgba(239,68,68,0.18)',
          backgroundColor: pressed
            ? isDark
              ? 'rgba(251,113,133,0.16)'
              : 'rgba(254,226,226,1)'
            : isDark
              ? 'rgba(251,113,133,0.1)'
              : 'rgba(254,242,242,0.95)',
          paddingHorizontal: 16,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        })}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: isDark ? 'rgba(251,113,133,0.16)' : 'rgba(239,68,68,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LogOut size={18} color={colors.error} strokeWidth={1.9} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 15,
              lineHeight: 20,
              color: colors.error,
            }}
          >
            {t('profile.logout')}
          </Text>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: 'GolosText_400Regular',
              fontSize: 12,
              lineHeight: 16,
              color: isDark ? 'rgba(251,113,133,0.72)' : 'rgba(185,28,28,0.72)',
            }}
          >
            {t('profile.logout_subtitle')}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
