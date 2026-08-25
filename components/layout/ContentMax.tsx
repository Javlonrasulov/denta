import React from 'react';
import { View, ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

interface ContentMaxProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ContentMax({ children, style }: ContentMaxProps) {
  const { layout } = useTheme();
  return (
    <View
      style={[
        {
          width: '100%',
          maxWidth: layout.contentMaxWidth,
          alignSelf: 'center',
          minWidth: 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
