import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from '@/components/icons';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  MobileCard,
  MobileHeader,
  MobileIconButton,
  MobileScreen,
  MobileSection,
} from '@/components/mobile';
import { Odontogram } from '@/components/odontogram/Odontogram';
import { ErrorState } from '@/components/states/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { usePatient } from '@/hooks/queries';
import { MOCK_ODONTOGRAM } from '@/mocks/data';
import { useTheme } from '@/theme';

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
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
    <MobileScreen contentStyle={{ gap: spacing.xl }}>
      <MobileHeader
        left={
          <MobileIconButton accessibilityLabel={t('common.back')} onPress={() => router.back()}>
            <ArrowLeft size={18} color={colors.text} strokeWidth={1.8} />
          </MobileIconButton>
        }
      />

      <MobileCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <Avatar name={p.fullName} size={56} />
          <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
            <Text variant="h3" numberOfLines={1}>
              {p.fullName}
            </Text>
            <Text variant="bodySmall" muted>
              {p.phone}
            </Text>
            <Text variant="caption" muted>
              {t('patients.last_visit')}: {p.lastVisit ?? '—'}
            </Text>
            {p.notes ? (
              <Text variant="caption" muted numberOfLines={2}>
                {t('patients.notes')}: {p.notes}
              </Text>
            ) : null}
          </View>
        </View>
      </MobileCard>

      <MobileSection title={t('odontogram.title')} style={{ marginBottom: 0 }}>
        <Odontogram teeth={MOCK_ODONTOGRAM} />
      </MobileSection>
    </MobileScreen>
  );
}
