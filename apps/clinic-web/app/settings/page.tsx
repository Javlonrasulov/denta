'use client';

import { CLINIC_CITY, CLINIC_NAME } from '@denta/mocks';
import { AppShell } from '@/components/layout/AppShell';
import { Panel } from '@/components/ui/crm';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function SettingsPage() {
  const { t } = useCrmI18n();

  return (
    <AppShell title={t('crm.settings.title')} subtitle={t('crm.settings.subtitle')}>
      <div className="max-w-xl">
        <Panel title={t('crm.settings.clinic_profile')}>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-slate-500">{t('crm.settings.name')}</dt>
              <dd className="mt-1 font-medium text-slate-900">{CLINIC_NAME}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('crm.settings.city')}</dt>
              <dd className="mt-1 font-medium text-slate-900">{CLINIC_CITY}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('crm.settings.timezone')}</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {t('crm.settings.timezone_value')}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('crm.settings.currency')}</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {t('crm.settings.currency_value')}
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
    </AppShell>
  );
}
