import { View } from 'react-native';
import { RefreshCw } from '@/components/icons';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

type Props = {
  onRetry: () => void;
};

export function SearchError({ onRetry }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 24,
          backgroundColor: colors.errorMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <RefreshCw size={26} color={colors.error} strokeWidth={1.8} />
      </View>
      <Text variant="h2" center>
        {t('search.error_title')}
      </Text>
      <Text variant="bodySmall" muted center style={{ maxWidth: 280 }}>
        {t('search.error_hint')}
      </Text>
      <View style={{ marginTop: 8, minWidth: 160 }}>
        <Button title={t('common.retry')} onPress={onRetry} variant="outline" />
      </View>
    </View>
  );
}
