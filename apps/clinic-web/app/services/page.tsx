'use client';

import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { AppShell } from '@/components/layout/AppShell';
import { DataTable, Panel } from '@/components/ui/crm';
import { clinicApi } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function ServicesPage() {
  const { t, money } = useCrmI18n();
  const query = useClinicQuery('services', clinicApi.services);

  return (
    <AppShell title={t('crm.services.title')} subtitle={t('crm.services.subtitle')}>
      <CrmQueryState
        apiConfigured={query.apiConfigured}
        loading={query.loading}
        error={query.error}
      >
        <Panel title={t('crm.services.catalog')}>
          {(query.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">{t('crm.patient_flow.empty_title')}</p>
          ) : (
            <DataTable
              columns={[
                t('crm.columns.service'),
                t('crm.columns.category'),
                t('crm.columns.duration'),
                t('crm.columns.price'),
              ]}
              rows={(query.data ?? []).map((s) => [
                <span key="n" className="font-medium text-slate-900">
                  {s.name}
                </span>,
                s.category,
                t('crm.services.minutes_short', { count: s.durationMinutes }),
                money(s.price),
              ])}
            />
          )}
        </Panel>
      </CrmQueryState>
    </AppShell>
  );
}
