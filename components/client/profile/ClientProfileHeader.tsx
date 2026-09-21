import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';

export function ClientProfileHeader() {
  const { t } = useTranslation();
  const { colors } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 8 } : null;

  return (
    <Animated.View entering={FadeInDown.duration(260)}>
      <View style={{ gap: 2, paddingBottom: 2 }}>
        <Text
          maxFontSizeMultiplier={1.05}
          style={{
            fontFamily: 'Geologica_700Bold',
            fontSize: 28,
            lineHeight: 34,
            letterSpacing: -0.5,
            color: colors.text,
            ...androidPad,
          }}
        >
          {t('profile.title')}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'GolosText_400Regular',
            fontSize: 13,
            lineHeight: 18,
            color: colors.textMuted,
          }}
        >
          {t('profile.cabinet_subtitle')}
        </Text>
      </View>
    </Animated.View>
  );
}
