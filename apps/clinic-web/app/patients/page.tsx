'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, DataTable, Panel } from '@/components/ui/crm';
import { clinicApi } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

const digits = (value: string) => value.replace(/\D/g, '');

function PatientsTable() {
  const { t, money, status } = useCrmI18n();
  const query = useClinicQuery('patients', clinicApi.patients);
  const q = (useSearchParams().get('q') ?? '').trim().toLowerCase();

  const patients = useMemo(() => {
    const all = query.data ?? [];
    if (!q) return all;
    const qDigits = digits(q);
    return all.filter((p) => {
      const haystack = `${p.fullName ?? ''} ${p.displayId ?? ''} ${p.id}`.toLowerCase();
      return haystack.includes(q) || (qDigits.length >= 3 && digits(p.phone ?? '').includes(qDigits));
    });
  }, [query.data, q]);

  return (
    <CrmQueryState
      apiConfigured={query.apiConfigured}
      loading={query.loading}
      error={query.error}
    >
      <Panel title={t('crm.patients.list')}>
        {patients.length === 0 ? (
          <p className="text-sm text-fg-muted">{t('crm.state.empty')}</p>
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
            rows={patients.map((p) => [
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
  );
}

export default function PatientsPage() {
  const { t } = useCrmI18n();

  return (
    <AppShell title={t('crm.patients.title')} subtitle={t('crm.patients.subtitle')}>
      <Suspense fallback={null}>
        <PatientsTable />
      </Suspense>
    </AppShell>
  );
}
