'use client';

import { useEffect, useMemo } from 'react';

import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, DataTable, Panel } from '@/components/ui/crm';
import { clinicApi } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';
import { connectClinicRealtime } from '@/lib/realtime';

export default function AppointmentsPage() {
  const { t, money, date, status } = useCrmI18n();
  const query = useClinicQuery('appointments', clinicApi.appointments);

  useEffect(() => {
    return connectClinicRealtime(() => {
      void query.refetch();
    });
  }, [query.refetch]);

  const rows = useMemo(() => {
    const list = query.data ?? [];
    return [...list].sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
    );
  }, [query.data]);

  return (
    <AppShell title={t('crm.appointments.title')} subtitle={t('crm.appointments.subtitle')}>
      <CrmQueryState
        apiConfigured={query.apiConfigured}
        loading={query.loading}
        error={query.error}
      >
        <Panel title={t('crm.appointments.all')}>
          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">{t('crm.dashboard.empty_today')}</p>
          ) : (
            <DataTable
              columns={[
                t('crm.columns.date'),
                t('crm.columns.time'),
                t('crm.columns.patient'),
                t('crm.columns.doctor'),
                t('crm.columns.service'),
                t('crm.columns.price'),
                t('crm.columns.status'),
              ]}
              rows={rows.map((a) => [
                date(a.date),
                a.time,
                a.patientName,
                a.doctorName,
                a.serviceName,
                money(a.price),
                <Badge key="s" status={a.status}>
                  {status(a.status)}
                </Badge>,
              ])}
            />
          )}
        </Panel>
      </CrmQueryState>
    </AppShell>
  );
}
