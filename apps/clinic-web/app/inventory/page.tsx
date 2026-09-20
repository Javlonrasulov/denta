'use client';

import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, DataTable, Panel } from '@/components/ui/crm';
import { clinicApi } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function InventoryPage() {
  const { t, money, status } = useCrmI18n();
  const query = useClinicQuery('inventory', clinicApi.inventory);

  return (
    <AppShell title={t('crm.inventory.title')} subtitle={t('crm.inventory.subtitle')}>
      <CrmQueryState
        apiConfigured={query.apiConfigured}
        loading={query.loading}
        error={query.error}
      >
        <Panel title={t('crm.inventory.stock_items')}>
          {(query.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">{t('crm.patient_flow.empty_title')}</p>
          ) : (
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
              rows={(query.data ?? []).map((item) => {
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
          )}
        </Panel>
      </CrmQueryState>
    </AppShell>
  );
}
