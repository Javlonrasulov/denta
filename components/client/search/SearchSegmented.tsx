import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

import type { SearchTab } from './types';

type Props = {
  value: SearchTab;
  onChange: (tab: SearchTab) => void;
};

export function SearchSegmented({ value, onChange }: Props) {
  const { t } = useTranslation();
  const { colors, shadows, isDark } = useTheme();

  const options: { value: SearchTab; label: string }[] = [
    { value: 'clinics', label: t('favorites.clinics') },
    { value: 'doctors', label: t('favorites.doctors') },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: isDark ? colors.surfaceSoft : '#EEF2FF',
        borderRadius: 16,
        padding: 4,
        gap: 4,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              {
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 8,
                paddingVertical: 10,
                backgroundColor: active ? colors.surface : 'transparent',
              },
              active ? shadows.sm : null,
            ]}
          >
            <Text
              variant="label"
              color={active ? colors.primary : colors.textMuted}
              numberOfLines={1}
              style={{ fontSize: 14, letterSpacing: -0.15 }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
