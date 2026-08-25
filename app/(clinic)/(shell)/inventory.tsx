import { useMemo } from 'react';
import { View } from 'react-native';
import { AlertTriangle, Boxes, Coins } from '@/components/icons';
import { useTranslation } from 'react-i18next';

import { AppShell } from '@/components/layout/AppShell';
import { DataTable, KpiStat, Section } from '@/components/crm';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useInventory, useLowStock } from '@/hooks/queries';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function ClinicInventoryScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const inventory = useInventory();
  const lowStock = useLowStock();

  const totalValue = useMemo(
    () => (inventory.data ?? []).reduce((s, i) => s + i.quantity * i.purchasePrice, 0),
    [inventory.data],
  );

  return (
    <AppShell title={t('crm.inventory.title')} subtitle={t('crm.inventory.subtitle')}>
      <View style={{ gap: spacing.xl }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <KpiStat
            label={t('crm.inventory.total_items')}
            value={String(inventory.data?.length ?? 0)}
            icon={Boxes}
          />
          <KpiStat
            label={t('crm.inventory.low_stock')}
            value={String(lowStock.data?.length ?? 0)}
            icon={AlertTriangle}
            trendUp={false}
          />
          <KpiStat label={t('crm.inventory.value')} value={formatPrice(totalValue)} icon={Coins} />
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Button title={t('crm.inventory.add_material')} size="sm" onPress={() => undefined} />
        </View>

        {inventory.isLoading ? (
          <ListSkeleton rows={6} />
        ) : (
          <Section title={t('crm.inventory.title')} padded={false}>
            <DataTable
              data={inventory.data ?? []}
              keyExtractor={(i) => i.id}
              columns={[
                {
                  key: 'name',
                  title: t('crm.inventory.material'),
                  flex: 1.4,
                  render: (i) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text variant="bodySmall" weight="semibold">
                        {i.name}
                      </Text>
                      {i.quantity <= i.minStock ? (
                        <Badge label={t('clinic_crm.low_stock')} tone="warning" />
                      ) : null}
                    </View>
                  ),
                },
                {
                  key: 'stock',
                  title: t('crm.inventory.stock'),
                  render: (i) => (
                    <Text variant="caption" color={i.quantity <= i.minStock ? colors.warning : colors.text}>
                      {i.quantity} {i.unit}
                    </Text>
                  ),
                },
                {
                  key: 'price',
                  title: t('crm.services.price'),
                  render: (i) => (
                    <Text variant="caption" muted>
                      {formatPrice(i.purchasePrice)}
                    </Text>
                  ),
                },
                {
                  key: 'supplier',
                  title: 'Supplier',
                  render: (i) => (
                    <Text variant="caption" muted numberOfLines={1}>
                      {i.supplier}
                    </Text>
                  ),
                },
              ]}
            />
          </Section>
        )}
      </View>
    </AppShell>
  );
}
