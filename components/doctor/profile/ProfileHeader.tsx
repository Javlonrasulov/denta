import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Pencil } from '@/components/icons';
import { Text } from '@/components/ui/Text';

export function ProfileHeader({ onEdit }: { onEdit: () => void }) {
  const { t } = useTranslation();
  const { colors, isDark } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 8 } : null;

  return (
    <Animated.View
      entering={FadeInDown.duration(260)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
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
          {t('doctor_profile.title')}
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
          {t('doctor_profile.cabinet_subtitle')}
        </Text>
      </View>
      <ScalePressable
        accessibilityLabel={t('doctor_profile.edit')}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onEdit();
        }}
        style={{
          height: 40,
          paddingHorizontal: 14,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: isDark ? 'rgba(129,140,248,0.18)' : 'rgba(67,56,202,0.12)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(165,180,252,0.28)' : 'rgba(67,56,202,0.18)',
        }}
      >
        <Pencil size={14} color={colors.primary} strokeWidth={2.1} />
        <Text
          style={{
            fontFamily: 'GolosText_600SemiBold',
            fontSize: 13,
            color: colors.primary,
          }}
        >
          {t('doctor_profile.edit')}
        </Text>
      </ScalePressable>
    </Animated.View>
  );
}
