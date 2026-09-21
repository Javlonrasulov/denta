import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

type Props = {
  visible: boolean;
  onUndo: () => void;
};

export function FavoritesUndoBar({ visible, onUndo }: Props) {
  const { t } = useTranslation();
  const { colors, shadows, isDark } = useTheme();

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      pointerEvents="box-none"
    >
      <View
        style={[
          shadows.md,
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 10,
            paddingLeft: 16,
            paddingRight: 8,
            borderRadius: 16,
            backgroundColor: isDark ? colors.surfaceElevated : '#0F172A',
          },
        ]}
      >
        <Text
          variant="bodySmall"
          color="#F8FAFC"
          style={{ flex: 1, fontSize: 13 }}
          numberOfLines={2}
        >
          {t('favorites.removed')}
        </Text>
        <Pressable
          onPress={onUndo}
          accessibilityRole="button"
          accessibilityLabel={t('favorites.undo')}
          hitSlop={6}
          style={{
            minHeight: 36,
            paddingHorizontal: 12,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.12)',
          }}
        >
          <Text variant="label" color="#C7D2FE" style={{ fontSize: 13 }}>
            {t('favorites.undo')}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
