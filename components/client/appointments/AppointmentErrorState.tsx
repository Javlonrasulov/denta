import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { RefreshCw } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

type Props = {
  onRetry: () => void;
};

export function AppointmentErrorState({ onRetry }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <View
      style={{
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['3xl'],
        alignItems: 'center',
      }}
    >
      <View
        style={[
          shadows.sm,
          {
            width: '100%',
            maxWidth: 360,
            borderRadius: radius['2xl'],
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            paddingHorizontal: spacing['2xl'],
            paddingVertical: spacing['3xl'],
            alignItems: 'center',
            gap: spacing.md,
          },
        ]}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 24,
            backgroundColor: colors.errorMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
          }}
        >
          <RefreshCw size={26} color={colors.error} strokeWidth={1.8} />
        </View>
        <Text variant="h2" center>
          {t('appointments.error_title')}
        </Text>
        <Text variant="bodySmall" muted center style={{ maxWidth: 280 }}>
          {t('appointments.error_hint')}
        </Text>
        <View style={{ marginTop: spacing.sm, minWidth: 180, width: '100%' }}>
          <Button
            title={t('common.retry')}
            onPress={onRetry}
            variant="outline"
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}
