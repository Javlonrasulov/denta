'use client';

import Link from 'next/link';
import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { AppShell } from '@/components/layout/AppShell';
import { Panel } from '@/components/ui/crm';
import { clinicApi } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function SettingsPage() {
  const { t } = useCrmI18n();
  const query = useClinicQuery('clinic-me', clinicApi.clinicMe);

  const clinic = query.data;
  const primaryBranch =
    clinic?.branches?.find((b) => b.isPrimary) ?? clinic?.branches?.[0];

  return (
    <AppShell title={t('crm.settings.title')} subtitle={t('crm.settings.subtitle')}>
      <CrmQueryState
        apiConfigured={query.apiConfigured}
        loading={query.loading}
        error={query.error}
      >
        <div className="max-w-xl">
          <Panel title={t('crm.settings.clinic_profile')}>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">{t('crm.settings.name')}</dt>
                <dd className="mt-1 font-medium text-slate-900">{clinic?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t('crm.settings.city')}</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {primaryBranch?.city ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t('crm.settings.timezone')}</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {clinic?.timezone ?? t('crm.settings.timezone_value')}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t('crm.settings.currency')}</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {t('crm.settings.currency_value')}
                </dd>
              </div>
              <div className="pt-2">
                <Link
                  href="/settings/employees"
                  className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
                >
                  Xodimlar / Employees
                </Link>
              </div>
            </dl>
          </Panel>
        </div>
      </CrmQueryState>
    </AppShell>
  );
}
