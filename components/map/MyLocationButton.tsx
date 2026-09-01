import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

import { LocateFixed } from '@/components/icons';
import { useTheme } from '@/theme';

type Props = {
  onPress: () => void;
};

export function MyLocationButton({ onPress }: Props) {
  const { colors, shadows, radius, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="My location"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.btn,
        shadows.md,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          marginRight: spacing.lg,
          marginBottom: spacing.lg,
        },
      ]}
    >
      <LocateFixed color={colors.primary} size={22} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
