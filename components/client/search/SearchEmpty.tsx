import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BrandMark } from '@/components/brand/BrandMark';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

type Props = {
  onClear: () => void;
  canClear: boolean;
};

export function SearchEmpty({ onClear, canClear }: Props) {
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingBottom: 24,
        gap: 12,
      }}
    >
      <View
        style={[
          shadows.sm,
          {
            width: 88,
            height: 88,
            borderRadius: 28,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
          },
        ]}
      >
        <BrandMark size={40} />
      </View>
      <Text variant="h2" center>
        {t('search.no_results')}
      </Text>
      <Text variant="bodySmall" muted center style={{ maxWidth: 300 }}>
        {t('search.no_results_hint')}
      </Text>
      {canClear ? (
        <View style={{ marginTop: 8, minWidth: 180 }}>
          <Button title={t('search.clear_filters')} onPress={onClear} size="md" />
        </View>
      ) : null}
    </View>
  );
}
