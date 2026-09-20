'use client';

import { MOCK_DOCTORS } from '@denta/mocks';
import { AppShell } from '@/components/layout/AppShell';
import { DataTable, Panel } from '@/components/ui/crm';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function DoctorsPage() {
  const { t, money } = useCrmI18n();

  return (
    <AppShell title={t('crm.doctors.title')} subtitle={t('crm.doctors.subtitle')}>
      <Panel title={t('crm.doctors.roster')}>
        <DataTable
          columns={[
            t('crm.columns.doctor'),
            t('crm.columns.specialization'),
            t('crm.columns.experience'),
            t('crm.columns.rating'),
            t('crm.columns.from'),
          ]}
          rows={MOCK_DOCTORS.map((d) => [
            <div key="n" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
              <span className="font-medium text-slate-900">{d.fullName}</span>
            </div>,
            d.specialization,
            t('crm.doctors.years_short', { count: d.experienceYears }),
            d.rating.toFixed(1),
            money(d.priceFrom),
          ])}
        />
      </Panel>
    </AppShell>
  );
}
