import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/Text';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useFinance } from '@/hooks/queries';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function DoctorFinanceScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const finance = useFinance('today');

  const income = finance.data?.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0) ?? 0;
  const expenses = finance.data?.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0) ?? 0;

  if (finance.isLoading) return <ListSkeleton rows={5} />;

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
      <Text variant="h1">{t('tabs.finance')}</Text>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {[
          { label: t('finance.income'), value: income, color: colors.success },
          { label: t('finance.expenses'), value: expenses, color: colors.error },
          { label: t('finance.net_income'), value: income - expenses, color: colors.primary },
        ].map((card) => (
          <View
            key={card.label}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              gap: spacing.xs,
            }}
          >
            <Text variant="caption" muted>
              {card.label}
            </Text>
            <Text variant="label" color={card.color}>
              {formatPrice(card.value)}
            </Text>
          </View>
        ))}
      </View>

      <Text variant="h3">{t('finance.history')}</Text>
      {(finance.data ?? []).map((row) => (
        <View
          key={row.id}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            gap: spacing.xs,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="body">{row.serviceName}</Text>
            <Text variant="label" color={row.type === 'income' ? colors.success : colors.error}>
              {row.type === 'income' ? '+' : '-'}
              {formatPrice(row.amount)}
            </Text>
          </View>
          <Text variant="caption" muted>
            {row.date}
            {row.patientName ? ` · ${row.patientName}` : ''}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
