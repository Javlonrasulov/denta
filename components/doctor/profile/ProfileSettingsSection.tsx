import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { Text } from '@/components/ui/Text';

export function ProfileSettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { colors, hairline, isDark } = useLoginTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'Geologica_600SemiBold',
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1.15,
          color: colors.textMuted,
          paddingHorizontal: 4,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: isDark ? '#151D2E' : '#F4F6FB',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: hairline,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}
