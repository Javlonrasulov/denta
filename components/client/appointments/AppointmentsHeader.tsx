import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { CalendarDays } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

export function AppointmentsHeader() {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows, isDark } = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <LinearGradient
          colors={
            isDark
              ? ['rgba(129,140,248,0.28)', 'rgba(34,211,238,0.16)']
              : ['#EEF2FF', '#ECFEFF']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            shadows.sm,
            {
              width: 52,
              height: 52,
              borderRadius: radius.xl,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <CalendarDays size={24} color={colors.primary} strokeWidth={1.9} />
        </LinearGradient>

        <View style={{ flex: 1, minWidth: 0, gap: 4, paddingTop: 2 }}>
          <Text
            variant="h1"
            style={{ fontSize: 28, lineHeight: 34, letterSpacing: -0.5 }}
          >
            {t('appointments.title')}
          </Text>
          <Text variant="bodySmall" muted style={{ lineHeight: 20 }}>
            {t('appointments.subtitle')}
          </Text>
        </View>
      </View>
    </View>
  );
}
