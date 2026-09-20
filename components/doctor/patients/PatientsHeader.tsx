import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Filter, UserPlus } from '@/components/icons';
import { Text } from '@/components/ui/Text';

export function PatientsHeader({
  count,
  onFilter,
  onAdd,
}: {
  count: number;
  onFilter?: () => void;
  onAdd?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, field, hairline } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 8 } : null;

  return (
    <Animated.View
      entering={FadeInDown.duration(280)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
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
          {t('patients.title')}
        </Text>
        <Text
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}
          style={{
            fontFamily: 'GolosText_400Regular',
            fontSize: 14,
            lineHeight: 20,
            color: colors.textSecondary,
            ...androidPad,
          }}
        >
          {t('patients.count', { count })}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <ScalePressable
          accessibilityLabel={t('patients.filter_a11y')}
          onPress={onFilter}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: field,
            borderWidth: 1,
            borderColor: hairline,
          }}
        >
          <Filter size={18} color={colors.textSecondary} strokeWidth={1.8} />
        </ScalePressable>
        <ScalePressable
          accessibilityLabel={t('patients.add_patient')}
          onPress={onAdd}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
          }}
        >
          <UserPlus size={18} color="#FFFFFF" strokeWidth={2} />
        </ScalePressable>
      </View>
    </Animated.View>
  );
}
