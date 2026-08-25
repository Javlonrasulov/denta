import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: '404' }} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing['2xl'],
          backgroundColor: colors.background,
          gap: spacing.lg,
        }}
      >
        <Text variant="h1">404</Text>
        <Text variant="body" muted center>
          {t('error.something_wrong')}
        </Text>
        <Link href="/" asChild>
          <Button title={t('common.back')} />
        </Link>
      </View>
    </>
  );
}
