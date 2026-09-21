import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Heart } from '@/components/icons';
import { useTheme } from '@/theme';

type Props = {
  isFavorite: boolean;
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FavoriteHeart({ isFavorite, onPress }: Props) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 14, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 320 });
      }}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={
        isFavorite ? t('favorites.remove_favorite') : t('favorites.add_favorite')
      }
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isFavorite
            ? isDark
              ? 'rgba(244,63,94,0.18)'
              : '#FFF1F2'
            : isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(255,255,255,0.96)',
          borderWidth: 1,
          borderColor: isFavorite
            ? isDark
              ? 'rgba(251,113,133,0.28)'
              : 'rgba(225,29,72,0.12)'
            : isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(15,23,42,0.06)',
        },
        anim,
      ]}
    >
      <Heart
        size={18}
        color={isFavorite ? '#E11D48' : colors.textMuted}
        fill={isFavorite ? '#E11D48' : 'transparent'}
        strokeWidth={isFavorite ? 1.6 : 1.9}
      />
    </AnimatedPressable>
  );
}
