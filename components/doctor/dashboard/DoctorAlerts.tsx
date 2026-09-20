import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useLoginTheme } from '@/components/auth/loginTheme';
import { ScalePressable } from '@/components/doctor/dashboard/ScalePressable';
import { Text } from '@/components/ui/Text';
import type { DoctorAlert } from '@/utils/doctorDashboard';

export function DoctorAlerts({
  alerts,
  onPress,
}: {
  alerts: DoctorAlert[];
  onPress?: (alert: DoctorAlert) => void;
}) {
  const { t } = useTranslation();
  const { colors, hairline } = useLoginTheme();
  const androidPad = Platform.OS === 'android' ? { paddingRight: 8 } : null;

  if (!alerts.length) return null;

  return (
    <Animated.View entering={FadeInDown.duration(280).delay(230)} style={{ gap: 12 }}>
      <Text
        style={{
          fontFamily: 'Geologica_700Bold',
          fontSize: 18,
          lineHeight: 24,
          color: colors.text,
        }}
      >
        {t('doctor_app.alerts')}
      </Text>
      <View style={{ gap: 0 }}>
        {alerts.map((alert, index) => {
          const message =
            alert.kind === 'recall'
              ? t('doctor_app.alert_recall', { name: alert.patientName })
              : alert.kind === 'payment'
                ? t('doctor_app.alert_payment', { name: alert.patientName })
                : t('doctor_app.alert_unconfirmed', { time: alert.time });
          return (
            <ScalePressable
              key={alert.id}
              onPress={() => onPress?.(alert)}
              accessibilityLabel={message}
              style={{
                paddingVertical: 12,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: hairline,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    marginTop: 6,
                    backgroundColor: colors.primary,
                  }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: 'GolosText_400Regular',
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.textSecondary,
                    ...androidPad,
                  }}
                >
                  {message}
                </Text>
              </View>
            </ScalePressable>
          );
        })}
      </View>
    </Animated.View>
  );
}
