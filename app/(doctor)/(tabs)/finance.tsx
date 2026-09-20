import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  MobileCard,
  MobileHeader,
  MobileScreen,
  MobileSection,
  MobileStatRow,
} from '@/components/mobile';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useFinance } from '@/hooks/queries';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function DoctorFinanceScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const finance = useFinance('today');

  const income = finance.data?.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0) ?? 0;
  const expenses =
    finance.data?.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0) ?? 0;

  if (finance.isLoading) return <ListSkeleton rows={8} fullPage />;

  return (
    <MobileScreen contentStyle={{ gap: spacing.xl }}>
      <MobileHeader title={t('tabs.finance')} />

      <MobileStatRow
        stats={[
          {
            id: 'income',
            label: t('finance.income'),
            value: formatPrice(income),
          },
          {
            id: 'expenses',
            label: t('finance.expenses'),
            value: formatPrice(expenses),
          },
          {
            id: 'net',
            label: t('finance.net_income'),
            value: formatPrice(income - expenses),
          },
        ]}
      />

      <MobileSection title={t('finance.history')} style={{ marginBottom: 0 }}>
        <View style={{ gap: spacing.sm }}>
          {(finance.data ?? []).map((row) => (
            <MobileCard key={row.id}>
              <View style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
                  <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
                    {row.serviceName}
                  </Text>
                  <Text
                    variant="label"
                    color={row.type === 'income' ? colors.success : colors.error}
                  >
                    {row.type === 'income' ? '+' : '-'}
                    {formatPrice(row.amount)}
                  </Text>
                </View>
                <Text variant="caption" muted>
                  {row.date}
                  {row.patientName ? ` · ${row.patientName}` : ''}
                </Text>
              </View>
            </MobileCard>
          ))}
        </View>
      </MobileSection>
    </MobileScreen>
  );
}
