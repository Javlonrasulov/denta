'use client';

import { useEffect, useMemo } from 'react';
import { todayIso } from '@denta/utils';

import { PatientFlowCard } from '@/components/analytics/PatientFlowCard';
import { RevenueSeriesCard } from '@/components/analytics/RevenueSeriesCard';
import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/components/providers/AuthProvider';
import { Badge, DataTable, KpiCard, Panel } from '@/components/ui/crm';
import { clinicApi } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';
import { connectClinicRealtime } from '@/lib/realtime';

const skip = async () => null;

export default function OverviewPage() {
  const { t, money, status } = useCrmI18n();
  const { getPermissions } = useAuth();
  const today = todayIso();

  const perms = getPermissions?.() ?? [];
  const can = (p: string) => perms.length === 0 || perms.includes('*') || perms.includes(p);
  const canReports = can('reports:read');
  const canAppointments = can('appointment:read');
  const canDoctors = can('doctor:read');
  const canPatients = can('patient:read');

  // Staff only see the blocks for pages they were given; others would just 403.
  const dashboard = useClinicQuery('dashboard', canReports ? clinicApi.dashboard : skip);
  const appointments = useClinicQuery('appointments', canAppointments ? clinicApi.appointments : skip);
  const doctors = useClinicQuery('doctors', canDoctors ? clinicApi.doctors : skip);
  const patients = useClinicQuery('patients', canPatients ? clinicApi.patients : skip);
  const rooms = useClinicQuery('rooms', canReports ? clinicApi.rooms : skip);

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
          {!canReports && !canAppointments && !canDoctors && !canPatients ? (
            <Panel title={t('crm.dashboard.limited_title')}>
              <p className="text-sm text-slate-500">{t('crm.dashboard.limited_hint')}</p>
            </Panel>
          ) : null}

          {canReports ? (
            <>
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
            </>
          ) : null}

          {canAppointments || canDoctors ? (
            <div className="grid gap-6 laptop:grid-cols-5">
              {canAppointments ? (
                <Panel
                  title={t('crm.dashboard.todays_schedule')}
                  className={canDoctors ? 'laptop:col-span-3' : 'laptop:col-span-5'}
                >
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
              ) : null}

              {canDoctors ? (
                <Panel
                  title={t('crm.dashboard.top_doctors')}
                  className={canAppointments ? 'laptop:col-span-2' : 'laptop:col-span-5'}
                >
                  <ul className="space-y-3">
                    {topDoctors.map((d) => (
                      <li key={d.id} className="flex items-center gap-3">
                        {d.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={d.photoUrl}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-muted text-sm font-semibold text-primary"
                          >
                            {d.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
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
              ) : null}
            </div>
          ) : null}

          {canPatients ? (
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
          ) : null}
        </div>
      </CrmQueryState>
    </AppShell>
  );
}
