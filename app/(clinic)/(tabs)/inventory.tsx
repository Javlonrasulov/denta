import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/Badge';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useInventory, useLowStock } from '@/hooks/queries';
import { useTheme } from '@/theme';
import { formatPrice } from '@/utils/slots';

export default function ClinicInventoryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const inventory = useInventory();
  const lowStock = useLowStock();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md }}>
        <Text variant="h1">{t('tabs.inventory')}</Text>
        {(lowStock.data?.length ?? 0) > 0 ? (
          <Badge label={t('clinic_crm.low_stock')} tone="warning" />
        ) : null}
      </View>

      {inventory.isLoading ? (
        <ListSkeleton rows={6} />
      ) : (
        <FlatList
          data={inventory.data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          renderItem={({ item }) => {
            const low = item.quantity <= item.minStock;
            return (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.xl,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: low ? colors.warning : colors.borderSubtle,
                  gap: spacing.xs,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="h3" style={{ fontSize: 16, flex: 1 }}>
                    {item.name}
                  </Text>
                  {low ? <Badge label={t('clinic_crm.low_stock')} tone="warning" /> : null}
                </View>
                <Text variant="bodySmall" muted>
                  {item.quantity} {item.unit} · min {item.minStock}
                </Text>
                <Text variant="caption" muted>
                  {item.supplier} · {formatPrice(item.purchasePrice)}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
