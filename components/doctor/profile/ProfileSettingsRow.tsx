import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { ChevronRight, type LucideIcon } from '@/components/icons';
import { Text } from '@/components/ui/Text';

export function ProfileSettingsRow({
  icon: Icon,
  label,
  value,
  onPress,
  right,
  last,
  destructive,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
  destructive?: boolean;
}) {
  const { colors, hairline, isDark } = useLoginTheme();
  const tone = destructive ? colors.error : colors.primary;
  const iconBg = destructive
    ? isDark
      ? 'rgba(251,113,133,0.14)'
      : 'rgba(239,68,68,0.1)'
    : isDark
      ? 'rgba(129,140,248,0.14)'
      : 'rgba(67,56,202,0.08)';

  return (
    <ScalePressable
      accessibilityLabel={label}
      onPress={onPress}
      disabled={!onPress && !right}
      style={{
        minHeight: 56,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: hairline,
        opacity: !onPress && !right ? 0.92 : 1,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} color={tone} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.1}
          style={{
            fontFamily: 'GolosText_600SemiBold',
            fontSize: 14,
            lineHeight: 20,
            color: destructive ? colors.error : colors.text,
          }}
        >
          {label}
        </Text>
        {value ? (
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.1}
            style={{
              fontFamily: 'GolosText_400Regular',
              fontSize: 12,
              lineHeight: 16,
              color: colors.textMuted,
            }}
          >
            {value}
          </Text>
        ) : null}
      </View>
      {right ??
        (onPress ? <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.8} /> : null)}
    </ScalePressable>
  );
}
