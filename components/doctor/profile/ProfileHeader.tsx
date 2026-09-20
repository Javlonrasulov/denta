import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Pencil } from '@/components/icons';
import { Text } from '@/components/ui/Text';

export function ProfileHeader({ onEdit }: { onEdit: () => void }) {
  const { t } = useTranslation();
  const { colors, field, hairline } = useLoginTheme();
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
      <Text
        maxFontSizeMultiplier={1.05}
        style={{
          flex: 1,
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
      <ScalePressable
        accessibilityLabel={t('doctor_profile.edit')}
        onPress={onEdit}
        style={{
          height: 40,
          paddingHorizontal: 14,
          borderRadius: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: field,
          borderWidth: 1,
          borderColor: hairline,
        }}
      >
        <Pencil size={14} color={colors.primary} strokeWidth={2} />
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
