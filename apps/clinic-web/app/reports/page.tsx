'use client';

import {
  getClinicDashboardStats,
  MOCK_APPOINTMENTS,
  MOCK_FINANCE,
  MOCK_ROOMS,
} from '@denta/mocks';
import { AppShell } from '@/components/layout/AppShell';
import { KpiCard, Panel } from '@/components/ui/crm';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function ReportsPage() {
  const { t, money } = useCrmI18n();
  const stats = getClinicDashboardStats();
  const completed = MOCK_APPOINTMENTS.filter((a) => a.status === 'completed').length;
  const upcoming = MOCK_APPOINTMENTS.filter((a) => a.status === 'upcoming').length;
  const paid = MOCK_FINANCE.filter((r) => r.paymentStatus === 'paid').length;

  return (
    <AppShell title={t('crm.reports.title')} subtitle={t('crm.reports.subtitle')}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 laptop:grid-cols-4">
          <KpiCard label={t('crm.reports.completed_visits')} value={String(completed)} />
          <KpiCard label={t('crm.reports.upcoming')} value={String(upcoming)} />
          <KpiCard label={t('crm.reports.cancelled')} value={String(stats.cancelled)} />
          <KpiCard label={t('crm.reports.paid_invoices')} value={String(paid)} />
        </div>

        <div className="grid gap-6 laptop:grid-cols-2">
          <Panel title={t('crm.reports.revenue_summary')}>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              {money(stats.revenue)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {t('crm.reports.revenue_summary_hint')}
            </p>
          </Panel>
          <Panel title={t('crm.reports.room_utilization')}>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              {MOCK_ROOMS.filter((r) => r.status === 'occupied').length}/{MOCK_ROOMS.length}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {t('crm.reports.room_utilization_hint')}
            </p>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
