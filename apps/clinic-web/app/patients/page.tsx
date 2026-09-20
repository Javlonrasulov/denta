'use client';

import { MOCK_PATIENTS } from '@denta/mocks';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, DataTable, Panel } from '@/components/ui/crm';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function PatientsPage() {
  const { t, money, status } = useCrmI18n();

  return (
    <AppShell title={t('crm.patients.title')} subtitle={t('crm.patients.subtitle')}>
      <Panel title={t('crm.patients.list')}>
        <DataTable
          columns={[
            t('crm.columns.id'),
            t('crm.columns.name'),
            t('crm.columns.phone'),
            t('crm.columns.clinical'),
            t('crm.columns.balance'),
            t('crm.columns.visits'),
          ]}
          rows={MOCK_PATIENTS.map((p) => [
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
      </Panel>
    </AppShell>
  );
}
