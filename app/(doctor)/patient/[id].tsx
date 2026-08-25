import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Odontogram } from '@/components/odontogram/Odontogram';
import { ErrorState } from '@/components/states/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { usePatient } from '@/hooks/queries';
import { MOCK_ODONTOGRAM } from '@/mocks/data';
import { useTheme } from '@/theme';

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const patient = usePatient(id);

  if (patient.isLoading) return <ListSkeleton rows={5} />;
  if (!patient.data) {
    return (
      <ErrorState
        title={t('error.something_wrong')}
        onRetry={() => patient.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  const p = patient.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing['5xl'],
        gap: spacing.xl,
      }}
    >
      <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 44, height: 44, justifyContent: 'center' }}>
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>

      <View style={{ gap: spacing.xs }}>
        <Text variant="h1">{p.fullName}</Text>
        <Text variant="body" muted>
          {p.phone}
        </Text>
        <Text variant="bodySmall" muted>
          {t('patients.last_visit')}: {p.lastVisit ?? '—'}
        </Text>
        {p.notes ? (
          <Text variant="bodySmall" muted>
            {t('patients.notes')}: {p.notes}
          </Text>
        ) : null}
      </View>

      <Odontogram teeth={MOCK_ODONTOGRAM} />
    </ScrollView>
  );
}
