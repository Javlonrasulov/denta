import { View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Camera } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { doctorInitials } from '@/utils/doctorProfile';

export function DoctorAvatar({
  uri,
  firstName,
  lastName,
  size = 108,
  onPress,
  editable = true,
}: {
  uri?: string | null;
  firstName: string;
  lastName: string;
  size?: number;
  onPress?: () => void;
  editable?: boolean;
}) {
  const { colors, isDark } = useLoginTheme();
  const initials = doctorInitials(firstName, lastName);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const badge = Math.round(size * 0.3);

  return (
    <ScalePressable
      accessibilityLabel={firstName}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={{ width: size + 6, height: size + 6, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        entering={FadeIn.duration(280)}
        onTouchStart={() => {
          scale.value = withSpring(0.96, { damping: 16, stiffness: 280 });
        }}
        onTouchEnd={() => {
          scale.value = withSpring(1, { damping: 16, stiffness: 280 });
        }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 3,
            borderColor: isDark ? 'rgba(165,180,252,0.28)' : 'rgba(67,56,202,0.16)',
            backgroundColor: isDark ? 'rgba(129,140,248,0.16)' : 'rgba(67,56,202,0.1)',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          },
          animStyle,
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
        ) : (
          <Text
            maxFontSizeMultiplier={1}
            style={{
              fontFamily: 'Geologica_700Bold',
              fontSize: size * 0.32,
              lineHeight: size * 0.38,
              color: colors.primary,
              letterSpacing: -0.6,
            }}
          >
            {initials}
          </Text>
        )}
      </Animated.View>
      {editable ? (
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 2,
            width: badge,
            height: badge,
            borderRadius: badge / 2,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: isDark ? '#0B1220' : '#E3E9F4',
          }}
        >
          <Camera size={badge * 0.46} color="#FFFFFF" strokeWidth={2.1} />
        </View>
      ) : null}
    </ScalePressable>
  );
}
