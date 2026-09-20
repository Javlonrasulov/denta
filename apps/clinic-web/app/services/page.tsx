'use client';

import { MOCK_SERVICES } from '@denta/mocks';
import { AppShell } from '@/components/layout/AppShell';
import { DataTable, Panel } from '@/components/ui/crm';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function ServicesPage() {
  const { t, money } = useCrmI18n();

  return (
    <AppShell title={t('crm.services.title')} subtitle={t('crm.services.subtitle')}>
      <Panel title={t('crm.services.catalog')}>
        <DataTable
          columns={[
            t('crm.columns.service'),
            t('crm.columns.category'),
            t('crm.columns.duration'),
            t('crm.columns.price'),
          ]}
          rows={MOCK_SERVICES.map((s) => [
            <span key="n" className="font-medium text-slate-900">
              {s.name}
            </span>,
            s.category,
            t('crm.services.minutes_short', { count: s.durationMinutes }),
            money(s.price),
          ])}
        />
      </Panel>
    </AppShell>
  );
}
