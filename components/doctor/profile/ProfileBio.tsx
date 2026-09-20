import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';

export function ProfileBio({ bio, onEdit }: { bio: string; onEdit: () => void }) {
  const { t } = useTranslation();
  const { colors, hairline, isDark } = useLoginTheme();
  const empty = !bio.trim();

  return (
    <Animated.View entering={FadeInDown.duration(280).delay(55)} style={{ gap: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 4,
        }}
      >
        <Text
          maxFontSizeMultiplier={1}
          style={{
            fontFamily: 'Geologica_600SemiBold',
            fontSize: 11,
            lineHeight: 14,
            letterSpacing: 1.2,
            color: colors.textMuted,
            textTransform: 'uppercase',
          }}
        >
          {t('doctor_profile.bio')}
        </Text>
        <ScalePressable
          accessibilityLabel={t('doctor_profile.bio_edit')}
          onPress={() => {
            void Haptics.selectionAsync();
            onEdit();
          }}
        >
          <Text
            style={{
              fontFamily: 'GolosText_600SemiBold',
              fontSize: 13,
              color: colors.primary,
            }}
          >
            {t('doctor_profile.bio_edit')}
          </Text>
        </ScalePressable>
      </View>
      <View
        style={{
          backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: hairline,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <Text
          maxFontSizeMultiplier={1.15}
          style={{
            fontFamily: 'GolosText_400Regular',
            fontSize: 14,
            lineHeight: 22,
            color: empty ? colors.textMuted : colors.textSecondary,
            fontStyle: empty ? 'italic' : 'normal',
          }}
        >
          {empty ? t('doctor_profile.bio_empty') : bio}
        </Text>
      </View>
    </Animated.View>
  );
}
