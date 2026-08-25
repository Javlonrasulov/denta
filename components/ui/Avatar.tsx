import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Text } from './Text';
import { useTheme } from '@/theme';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ uri, name, size = 44, style }: AvatarProps) {
  const { colors, radius } = useTheme();
  const initials =
    name
      ?.split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?';

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.full,
          backgroundColor: colors.primaryMuted,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Text
          variant="label"
          color={colors.primary}
          style={{ fontSize: size * 0.32 }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
