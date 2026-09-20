'use client';

import { MOCK_APPOINTMENTS } from '@denta/mocks';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, DataTable, Panel } from '@/components/ui/crm';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function AppointmentsPage() {
  const { t, money, date, status } = useCrmI18n();
  const rows = [...MOCK_APPOINTMENTS].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
  );

  return (
    <AppShell title={t('crm.appointments.title')} subtitle={t('crm.appointments.subtitle')}>
      <Panel title={t('crm.appointments.all')}>
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
      </Panel>
    </AppShell>
  );
}
