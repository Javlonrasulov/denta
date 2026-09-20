'use client';

import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, DataTable, Panel } from '@/components/ui/crm';
import { clinicApi } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function PatientsPage() {
  const { t, money, status } = useCrmI18n();
  const query = useClinicQuery('patients', clinicApi.patients);

  return (
    <AppShell title={t('crm.patients.title')} subtitle={t('crm.patients.subtitle')}>
      <CrmQueryState
        apiConfigured={query.apiConfigured}
        loading={query.loading}
        error={query.error}
      >
        <Panel title={t('crm.patients.list')}>
          {(query.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">{t('crm.patient_flow.empty_title')}</p>
          ) : (
            <DataTable
              columns={[
                t('crm.columns.id'),
                t('crm.columns.name'),
                t('crm.columns.phone'),
                t('crm.columns.clinical'),
                t('crm.columns.balance'),
                t('crm.columns.visits'),
              ]}
              rows={(query.data ?? []).map((p) => [
                p.displayId ?? p.id,
                p.fullName,
                p.phone,
                <Badge key="s" status={p.clinicalStatus ?? p.status}>
                  {status(p.clinicalStatus ?? p.status)}
                </Badge>,
                money(p.balance ?? 0),
                String(p.visitCount ?? 0),
              ])}
            />
          )}
        </Panel>
      </CrmQueryState>
    </AppShell>
  );
}
