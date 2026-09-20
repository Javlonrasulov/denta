import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Check } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { DURATION_OPTIONS } from '@/utils/doctorProfile';
import { ProfileSheet } from './ProfileSheet';

export function DurationSheet({
  visible,
  value,
  onClose,
  onChange,
}: {
  visible: boolean;
  value: number;
  onClose: () => void;
  onChange: (minutes: number) => void;
}) {
  const { t } = useTranslation();
  const { colors, field, hairline } = useLoginTheme();

  return (
    <ProfileSheet visible={visible} onClose={onClose} title={t('doctor_profile.duration_title')} scroll={false}>
      <View style={{ gap: 8 }}>
        {DURATION_OPTIONS.map((item) => {
          const active = item === value;
          return (
            <ScalePressable
              key={item}
              accessibilityLabel={t('doctor_profile.duration_value', { n: item })}
              onPress={() => {
                void Haptics.selectionAsync();
                onChange(item);
                onClose();
              }}
              style={{
                minHeight: 52,
                borderRadius: 14,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: active ? colors.primaryMuted : field,
                borderWidth: 1,
                borderColor: active ? colors.primary : hairline,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontFamily: active ? 'GolosText_600SemiBold' : 'GolosText_500Medium',
                  fontSize: 16,
                  color: active ? colors.primary : colors.text,
                }}
              >
                {t('doctor_profile.duration_value', { n: item })}
              </Text>
              {active ? <Check size={18} color={colors.primary} strokeWidth={2.4} /> : null}
            </ScalePressable>
          );
        })}
      </View>
    </ProfileSheet>
  );
}
