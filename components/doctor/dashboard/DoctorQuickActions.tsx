import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import type { LucideIcon } from '@/components/icons';
import { CalendarClock, CalendarPlus, UserPlus, Wallet } from '@/components/icons';
import { Text } from '@/components/ui/Text';

function ActionTile({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
}) {
  const { colors, hairline, field, isDark } = useLoginTheme();

  return (
    <ScalePressable
      accessibilityLabel={label}
      onPress={onPress}
      style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 8 }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? field : '#EEF2FF',
          borderWidth: 1,
          borderColor: hairline,
        }}
      >
        <Icon size={20} color={colors.primary} strokeWidth={1.8} />
      </View>
      <Text
        numberOfLines={2}
        maxFontSizeMultiplier={1.05}
        center
        style={{
          fontFamily: 'GolosText_500Medium',
          fontSize: 11,
          lineHeight: 14,
          color: colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </ScalePressable>
  );
}

export function DoctorQuickActions({
  onPatient,
  onAppointment,
  onSlot,
  onFinance,
}: {
  onPatient?: () => void;
  onAppointment?: () => void;
  onSlot?: () => void;
  onFinance?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Animated.View entering={FadeInDown.duration(280).delay(150)} style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ActionTile icon={UserPlus} label={t('doctor_app.quick_patient')} onPress={onPatient} />
        <ActionTile
          icon={CalendarPlus}
          label={t('doctor_app.quick_appointment')}
          onPress={onAppointment}
        />
        <ActionTile icon={CalendarClock} label={t('doctor_app.quick_slot')} onPress={onSlot} />
        <ActionTile icon={Wallet} label={t('doctor_app.tab_finance')} onPress={onFinance} />
      </View>
    </Animated.View>
  );
}
