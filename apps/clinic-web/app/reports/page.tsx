'use client';

import { useMemo } from 'react';

import { RevenueSeriesCard } from '@/components/analytics/RevenueSeriesCard';
import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { AppShell } from '@/components/layout/AppShell';
import { KpiCard, Panel } from '@/components/ui/crm';
import { clinicApi } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

export default function ReportsPage() {
  const { t, money } = useCrmI18n();
  const dashboard = useClinicQuery('dashboard', clinicApi.dashboard);
  const appointments = useClinicQuery('appointments', clinicApi.appointments);
  const finance = useClinicQuery('finance', clinicApi.finance);
  const rooms = useClinicQuery('rooms', clinicApi.rooms);

  const metrics = useMemo(() => {
    const apts = appointments.data ?? [];
    const fin = finance.data ?? [];
    const roomList = rooms.data ?? [];
    const stats = dashboard.data;

    const completed = apts.filter((a) => a.status === 'completed').length;
    const upcoming = apts.filter((a) => a.status === 'upcoming').length;
    const cancelled = apts.filter((a) => a.status === 'cancelled').length;
    const paid = fin.filter((r) => r.paymentStatus === 'paid').length;
    const occupied = roomList.filter((r) => r.status === 'occupied').length;

    return {
      completed,
      upcoming,
      cancelled,
      paid,
      revenue: stats?.revenueThisMonth ?? 0,
      occupied,
      totalRooms: roomList.length,
    };
  }, [appointments.data, finance.data, rooms.data, dashboard.data]);

  const loading =
    dashboard.loading || appointments.loading || finance.loading || rooms.loading;
  const error =
    dashboard.error ?? appointments.error ?? finance.error ?? rooms.error;

  return (
    <AppShell title={t('crm.reports.title')} subtitle={t('crm.reports.subtitle')}>
      <CrmQueryState
        apiConfigured={dashboard.apiConfigured}
        loading={loading}
        error={error}
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 laptop:grid-cols-4">
            <KpiCard
              label={t('crm.reports.completed_visits')}
              value={String(metrics.completed)}
            />
            <KpiCard label={t('crm.reports.upcoming')} value={String(metrics.upcoming)} />
            <KpiCard label={t('crm.reports.cancelled')} value={String(metrics.cancelled)} />
            <KpiCard label={t('crm.reports.paid_invoices')} value={String(metrics.paid)} />
          </div>

          <RevenueSeriesCard />

          <div className="grid gap-6 laptop:grid-cols-2">
            <Panel title={t('crm.reports.revenue_summary')}>
              <p className="text-kpi text-slate-900">{money(metrics.revenue)}</p>
              <p className="mt-2 text-sm font-normal text-slate-500">
                {t('crm.reports.revenue_summary_hint')}
              </p>
            </Panel>
            <Panel title={t('crm.reports.room_utilization')}>
              <p className="text-kpi text-slate-900">
                {metrics.occupied}/{metrics.totalRooms}
              </p>
              <p className="mt-2 text-sm font-normal text-slate-500">
                {t('crm.reports.room_utilization_hint')}
              </p>
            </Panel>
          </div>
        </div>
      </CrmQueryState>
    </AppShell>
  );
}
