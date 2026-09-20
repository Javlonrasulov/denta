'use client';

import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { AppShell } from '@/components/layout/AppShell';
import { DataTable, Panel } from '@/components/ui/crm';
import { clinicApi } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function DoctorsPage() {
  const { t, money } = useCrmI18n();
  const query = useClinicQuery('doctors', clinicApi.doctors);

  return (
    <AppShell title={t('crm.doctors.title')} subtitle={t('crm.doctors.subtitle')}>
      <CrmQueryState
        apiConfigured={query.apiConfigured}
        loading={query.loading}
        error={query.error}
      >
        <Panel title={t('crm.doctors.roster')}>
          {(query.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">{t('crm.patient_flow.empty_title')}</p>
          ) : (
            <DataTable
              columns={[
                t('crm.columns.doctor'),
                t('crm.columns.specialization'),
                t('crm.columns.experience'),
                t('crm.columns.rating'),
                t('crm.columns.from'),
              ]}
              rows={(query.data ?? []).map((d) => [
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
          )}
        </Panel>
      </CrmQueryState>
    </AppShell>
  );
}
