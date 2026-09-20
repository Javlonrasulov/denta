import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Check, Monitor, Moon, Sun } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { ProfileSheet } from './ProfileSheet';

type ThemeMode = 'light' | 'dark' | 'system';

const OPTIONS: { id: ThemeMode; icon: typeof Sun; labelKey: string }[] = [
  { id: 'light', icon: Sun, labelKey: 'doctor_profile.theme_light' },
  { id: 'dark', icon: Moon, labelKey: 'doctor_profile.theme_dark' },
  { id: 'system', icon: Monitor, labelKey: 'doctor_profile.theme_system' },
];

export function ThemeSelector({
  visible,
  value,
  onClose,
  onChange,
}: {
  visible: boolean;
  value: ThemeMode;
  onClose: () => void;
  onChange: (mode: ThemeMode) => void;
}) {
  const { t } = useTranslation();
  const { colors, field, hairline } = useLoginTheme();

  return (
    <ProfileSheet visible={visible} onClose={onClose} title={t('doctor_profile.theme_title')} scroll={false}>
      <View style={{ gap: 8 }}>
        {OPTIONS.map((item) => {
          const active = item.id === value;
          const Icon = item.icon;
          return (
            <ScalePressable
              key={item.id}
              accessibilityLabel={t(item.labelKey)}
              onPress={() => {
                void Haptics.selectionAsync();
                onChange(item.id);
                onClose();
              }}
              style={{
                minHeight: 54,
                borderRadius: 14,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: active ? colors.primaryMuted : field,
                borderWidth: 1,
                borderColor: active ? colors.primary : hairline,
              }}
            >
              <Icon size={18} color={active ? colors.primary : colors.textSecondary} strokeWidth={1.9} />
              <Text
                style={{
                  flex: 1,
                  fontFamily: active ? 'GolosText_600SemiBold' : 'GolosText_500Medium',
                  fontSize: 16,
                  color: active ? colors.primary : colors.text,
                }}
              >
                {t(item.labelKey)}
              </Text>
              {active ? <Check size={18} color={colors.primary} strokeWidth={2.4} /> : null}
            </ScalePressable>
          );
        })}
      </View>
    </ProfileSheet>
  );
}

export function themeLabelKey(mode: ThemeMode): string {
  if (mode === 'dark') return 'doctor_profile.theme_dark';
  if (mode === 'system') return 'doctor_profile.theme_system';
  return 'doctor_profile.theme_light';
}
