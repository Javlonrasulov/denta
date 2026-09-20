'use client';

import { MOCK_INVENTORY } from '@denta/mocks';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, DataTable, Panel } from '@/components/ui/crm';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function InventoryPage() {
  const { t, money, status } = useCrmI18n();

  return (
    <AppShell title={t('crm.inventory.title')} subtitle={t('crm.inventory.subtitle')}>
      <Panel title={t('crm.inventory.stock_items')}>
        <DataTable
          columns={[
            t('crm.columns.item'),
            t('crm.columns.qty'),
            t('crm.columns.unit'),
            t('crm.columns.min'),
            t('crm.columns.supplier'),
            t('crm.columns.cost'),
            t('crm.columns.stock'),
          ]}
          rows={MOCK_INVENTORY.map((item) => {
            const low = item.quantity <= item.minStock;
            return [
              <span key="n" className="font-medium text-slate-900">
                {item.name}
              </span>,
              String(item.quantity),
              item.unit,
              String(item.minStock),
              item.supplier,
              money(item.purchasePrice),
              <Badge key="s" status={low ? 'overdue' : 'available'}>
                {status(low ? 'low' : 'ok')}
              </Badge>,
            ];
          })}
        />
      </Panel>
    </AppShell>
  );
}
