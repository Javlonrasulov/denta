import { Image } from 'expo-image';
import { Platform, StyleSheet, View } from 'react-native';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';

export function PatientAvatar({
  name,
  uri,
  size = 46,
}: {
  name: string;
  uri?: string;
  size?: number;
}) {
  const { colors, isDark } = useLoginTheme();
  const initials =
    name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: isDark ? 'rgba(129,140,248,0.14)' : 'rgba(67,56,202,0.1)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(165,180,252,0.28)' : 'rgba(67,56,202,0.16)',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Text
          maxFontSizeMultiplier={1}
          style={{
            fontFamily: 'Geologica_600SemiBold',
            fontSize: Math.round(size * 0.32),
            lineHeight: Math.round(size * 0.4),
            color: colors.primary,
            letterSpacing: 0.4,
            ...(Platform.OS === 'android' ? { paddingRight: 1 } : null),
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
