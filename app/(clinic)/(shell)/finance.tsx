import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { TrendingDown, TrendingUp, Wallet, AlertCircle } from '@/components/icons';
import { useTranslation } from 'react-i18next';

import { AppShell } from '@/components/layout/AppShell';
import { DataTable, KpiStat, LineChartCard, Section, SegmentedControl } from '@/components/crm';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useFinance } from '@/hooks/queries';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';
import type { FinanceFilter } from '@/services/financeService';

export default function ClinicFinanceScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const [filter, setFilter] = useState<FinanceFilter>('month');
  const [range, setRange] = useState<'7d' | '30d' | '12m'>('30d');
  const finance = useFinance(filter);

  const { income, expenses, profit } = useMemo(() => {
    const rows = finance.data ?? [];
    const income = rows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const expenses = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    return { income, expenses, profit: income - expenses };
  }, [finance.data]);

  return (
    <AppShell title={t('crm.finance.title')} subtitle={t('crm.finance.subtitle')}>
      <View style={{ gap: spacing.xl }}>
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'today', label: t('finance.today') },
            { value: 'week', label: t('finance.week') },
            { value: 'month', label: t('finance.month') },
            { value: 'year', label: t('finance.year') },
          ]}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <KpiStat label={t('finance.income')} value={formatPrice(income)} icon={TrendingUp} trendUp />
          <KpiStat label={t('finance.expenses')} value={formatPrice(expenses)} icon={TrendingDown} trendUp={false} />
          <KpiStat label={t('crm.finance.profit')} value={formatPrice(profit)} icon={Wallet} />
          <KpiStat label={t('crm.finance.outstanding')} value={formatPrice(income * 0.08)} icon={AlertCircle} />
        </View>

        {finance.isLoading ? (
          <ListSkeleton rows={5} />
        ) : (
          <>
            <Section title={t('crm.finance.vs_expenses')}>
              <LineChartCard
                title=""
                range={range}
                onRangeChange={setRange}
                rangeLabels={[
                  { value: '7d', label: t('crm.dashboard.range_7d') },
                  { value: '30d', label: t('crm.dashboard.range_30d') },
                  { value: '12m', label: t('crm.dashboard.range_12m') },
                ]}
                points={[45, 52, 48, 60, 55, 70, 65, 72]}
              />
            </Section>

            <Section title={t('crm.finance.transactions')} padded={false}>
              <DataTable
                data={finance.data ?? []}
                keyExtractor={(r) => r.id}
                columns={[
                  {
                    key: 'date',
                    title: t('crm.finance.date'),
                    render: (r) => (
                      <Text variant="caption" muted>
                        {r.date}
                      </Text>
                    ),
                  },
                  {
                    key: 'type',
                    title: t('crm.finance.type'),
                    render: (r) => (
                      <Text
                        variant="caption"
                        weight="semibold"
                        color={r.type === 'income' ? colors.success : colors.error}
                      >
                        {r.type === 'income' ? t('finance.income') : t('finance.expenses')}
                      </Text>
                    ),
                  },
                  {
                    key: 'desc',
                    title: t('crm.finance.description'),
                    flex: 1.4,
                    render: (r) => (
                      <Text variant="bodySmall" numberOfLines={1}>
                        {r.serviceName}
                        {r.patientName ? ` · ${r.patientName}` : ''}
                      </Text>
                    ),
                  },
                  {
                    key: 'amount',
                    title: t('crm.finance.amount'),
                    render: (r) => (
                      <Text variant="caption" weight="semibold">
                        {formatPrice(r.amount)}
                      </Text>
                    ),
                  },
                  {
                    key: 'status',
                    title: t('common.status'),
                    render: (r) => (
                      <Text variant="caption" muted>
                        {t(`finance.${r.paymentStatus}`)}
                      </Text>
                    ),
                  },
                ]}
              />
            </Section>
          </>
        )}
      </View>
    </AppShell>
  );
}
