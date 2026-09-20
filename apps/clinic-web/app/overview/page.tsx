'use client';

import { useEffect, useMemo } from 'react';
import { todayIso } from '@denta/utils';

import { PatientFlowCard } from '@/components/analytics/PatientFlowCard';
import { RevenueSeriesCard } from '@/components/analytics/RevenueSeriesCard';
import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, DataTable, KpiCard, Panel } from '@/components/ui/crm';
import { clinicApi } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';
import { connectClinicRealtime } from '@/lib/realtime';

export default function OverviewPage() {
  const { t, money, status } = useCrmI18n();
  const today = todayIso();

  const dashboard = useClinicQuery('dashboard', clinicApi.dashboard);
  const appointments = useClinicQuery('appointments', clinicApi.appointments);
  const doctors = useClinicQuery('doctors', clinicApi.doctors);
  const patients = useClinicQuery('patients', clinicApi.patients);
  const rooms = useClinicQuery('rooms', clinicApi.rooms);

  useEffect(() => {
    return connectClinicRealtime(() => {
      void dashboard.refetch();
      void appointments.refetch();
    });
  }, [dashboard.refetch, appointments.refetch]);

  const todayApts = useMemo(() => {
    const rows = appointments.data ?? [];
    return rows
      .filter((a) => a.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments.data, today]);

  const topDoctors = useMemo(() => {
    const rows = doctors.data ?? [];
    return [...rows].sort((a, b) => b.rating - a.rating).slice(0, 4);
  }, [doctors.data]);

  const stats = dashboard.data;
  const roomList = rooms.data ?? [];
  const availableRooms = roomList.filter((r) => r.status === 'available').length;
  const occupancy = Math.round(
    ((roomList.length - availableRooms) / Math.max(roomList.length, 1)) * 100,
  );

  const loading =
    dashboard.loading ||
    appointments.loading ||
    doctors.loading ||
    patients.loading ||
    rooms.loading;
  const error =
    dashboard.error ?? appointments.error ?? doctors.error ?? patients.error ?? rooms.error;
  const apiConfigured = dashboard.apiConfigured;

  return (
    <AppShell title={t('crm.dashboard.title')} subtitle={t('crm.dashboard.subtitle')}>
      <CrmQueryState apiConfigured={apiConfigured} loading={loading} error={error}>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 laptop:grid-cols-4">
            <KpiCard
              label={t('crm.dashboard.revenue')}
              value={money(stats?.revenueThisMonth ?? 0)}
              hint={t('crm.dashboard.income_records')}
            />
            <KpiCard
              label={t('crm.dashboard.appointments')}
              value={String(stats?.appointmentsToday ?? 0)}
              hint={t('crm.dashboard.all_statuses')}
            />
            <KpiCard
              label={t('crm.dashboard.active_patients')}
              value={String(stats?.totalPatients ?? 0)}
            />
            <KpiCard
              label={t('crm.dashboard.room_occupancy')}
              value={`${occupancy}%`}
              hint={t('crm.dashboard.rooms_free', { count: availableRooms })}
            />
          </div>

          <PatientFlowCard />

          <RevenueSeriesCard />

          <div className="grid gap-6 laptop:grid-cols-5">
            <Panel title={t('crm.dashboard.todays_schedule')} className="laptop:col-span-3">
              {todayApts.length === 0 ? (
                <p className="text-sm text-slate-500">{t('crm.dashboard.empty_today')}</p>
              ) : (
                <DataTable
                  columns={[
                    t('crm.columns.time'),
                    t('crm.columns.patient'),
                    t('crm.columns.service'),
                    t('crm.columns.doctor'),
                    t('crm.columns.status'),
                  ]}
                  rows={todayApts.map((a) => [
                    <span key="t" className="font-medium text-slate-900">
                      {a.time}
                    </span>,
                    a.patientName,
                    a.serviceName,
                    a.doctorName,
                    <Badge key="s" status={a.status}>
                      {status(a.status)}
                    </Badge>,
                  ])}
                />
              )}
            </Panel>

            <Panel title={t('crm.dashboard.top_doctors')} className="laptop:col-span-2">
              <ul className="space-y-3">
                {topDoctors.map((d) => (
                  <li key={d.id} className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={d.photoUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{d.fullName}</p>
                      <p className="truncate text-xs text-slate-500">{d.specialization}</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-500">
                      {d.rating.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title={t('crm.dashboard.recent_patients')}>
            <DataTable
              columns={[
                t('crm.columns.id'),
                t('crm.columns.name'),
                t('crm.columns.phone'),
                t('crm.columns.status'),
                t('crm.columns.visits'),
              ]}
              rows={(patients.data ?? []).slice(0, 6).map((p) => [
                p.displayId ?? p.id,
                p.fullName,
                p.phone,
                <Badge key="s" status={p.clinicalStatus ?? p.status}>
                  {status(p.clinicalStatus ?? p.status)}
                </Badge>,
                String(p.visitCount ?? 0),
              ])}
            />
          </Panel>
        </div>
      </CrmQueryState>
    </AppShell>
  );
}
