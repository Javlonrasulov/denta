'use client';

import { AlertTriangle, Pencil, Star, Stethoscope, Trash2, UserPlus, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { AddDoctorModal } from '@/components/doctors/AddDoctorModal';
import { AppPresence } from '@/components/doctors/AppPresence';
import { EditDoctorModal } from '@/components/doctors/EditDoctorModal';
import { RemoveDoctorModal } from '@/components/doctors/RemoveDoctorModal';
import { ScheduleSummary } from '@/components/doctors/ScheduleSummary';
import { AppShell } from '@/components/layout/AppShell';
import { DataTable, Panel } from '@/components/ui/crm';
import { clinicApi, doctorFinanceApi, type ClinicDoctorRow } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { formatUzPhoneDisplay } from '@/lib/auth/phone';
import { readPersistedSession } from '@/lib/auth/session';
import { useDoctorFinanceAccess } from '@/lib/doctor-finance';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

/** Doctor ids without an active financial agreement; empty when the user cannot read doctor finance. */
function useUnconfiguredDoctors(enabled: boolean, version: unknown): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const token = readPersistedSession()?.accessToken;
    if (!enabled || !token) return;
    let cancelled = false;
    doctorFinanceApi
      .overview(token)
      .then(
        (o) =>
          !cancelled && setIds(new Set(o.rows.filter((r) => r.isActive && !r.agreement).map((r) => r.doctorId))),
      )
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled, version]);
  return ids;
}

function initials(d: ClinicDoctorRow): string {
  return `${d.firstName.charAt(0)}${d.lastName.charAt(0)}`.toUpperCase() || '—';
}

function useCanManageDoctors(): boolean {
  const [can, setCan] = useState(false);
  useEffect(() => {
    const perms = readPersistedSession()?.activeWorkspace?.permissions;
    setCan(!perms || perms.includes('*') || perms.includes('doctor:manage'));
  }, []);
  return can;
}

export default function DoctorsPage() {
  const { t, money } = useCrmI18n();
  const query = useClinicQuery('clinic-doctors', clinicApi.clinicDoctors);
  const canManage = useCanManageDoctors();
  const [addOpen, setAddOpen] = useState(false);
  const closeAdd = useCallback(() => setAddOpen(false), []);
  const [editing, setEditing] = useState<ClinicDoctorRow | null>(null);
  const closeEdit = useCallback(() => setEditing(null), []);
  const [removing, setRemoving] = useState<ClinicDoctorRow | null>(null);
  const closeRemove = useCallback(() => setRemoving(null), []);
  const { refetch } = query;
  const reload = useCallback(() => void refetch(), [refetch]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refetch();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [refetch]);

  const doctors = query.data ?? [];
  const finance = useDoctorFinanceAccess();
  const unconfigured = useUnconfiguredDoctors(finance.read, query.data);
  const missing = doctors.filter((d) => unconfigured.has(d.id)).length;

  const addButton = canManage ? (
    <button
      type="button"
      onClick={() => setAddOpen(true)}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-indigo-700 active:scale-[0.98]"
    >
      <UserPlus className="h-4 w-4" />
      {t('crm.doctors.add')}
    </button>
  ) : null;

  return (
    <AppShell title={t('crm.doctors.title')} subtitle={t('crm.doctors.subtitle')}>
      <CrmQueryState
        apiConfigured={query.apiConfigured}
        loading={query.loading && !query.data}
        error={query.error}
      >
        {missing > 0 ? (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-900">
              {t('crm.doctor_finance.list_banner', { count: missing })}
            </p>
          </div>
        ) : null}
        <Panel
          title={`${t('crm.doctors.roster')}${doctors.length ? ` · ${doctors.length}` : ''}`}
          action={addButton}
        >
          {doctors.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-muted text-primary">
                <Stethoscope className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">
                {t('crm.doctors.empty_title')}
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">{t('crm.doctors.empty_hint')}</p>
              {addButton ? <div className="mt-5">{addButton}</div> : null}
            </div>
          ) : (
            <DataTable
              columns={[
                t('crm.columns.doctor'),
                t('crm.columns.specialization'),
                t('crm.doctors.schedule.col'),
                t('crm.columns.experience'),
                t('crm.columns.rating'),
                t('crm.doctors.col_price'),
                t('crm.doctors.col_app'),
                ...(canManage ? [''] : []),
              ]}
              rows={doctors.map((d) => [
                <div key="n" className="flex min-w-[200px] items-center gap-3">
                  {d.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.photoUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-sm font-semibold text-primary">
                      {initials(d)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/doctors/${encodeURIComponent(d.id)}`}
                      className="block truncate font-semibold text-slate-900 hover:text-primary hover:underline"
                    >
                      {d.fullName}
                    </Link>
                    <p className="truncate text-xs text-slate-500">
                      {d.phone ? formatUzPhoneDisplay(d.phone) : '—'}
                    </p>
                    {unconfigured.has(d.id) ? (
                      <Link
                        href={`/doctors/${encodeURIComponent(d.id)}?tab=finance`}
                        className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200 hover:bg-amber-100"
                      >
                        <Wallet className="h-3 w-3" />
                        {t('crm.doctor_finance.not_configured')}
                      </Link>
                    ) : null}
                  </div>
                </div>,
                d.specialization ? (
                  <div key="sp" className="flex max-w-[260px] flex-wrap gap-1">
                    {d.specialization
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((s) => (
                        <span
                          key={s}
                          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
                        >
                          {s}
                        </span>
                      ))}
                  </div>
                ) : (
                  '—'
                ),
                <ScheduleSummary
                  key="sc"
                  schedule={d.schedule ?? []}
                  slotDuration={d.schedule?.length ? d.slotDuration : undefined}
                  className="min-w-[150px] max-w-[220px]"
                />,
                t('crm.doctors.years_short', { count: d.experienceYears }),
                <span key="r" className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {d.rating.toFixed(1)}
                </span>,
                d.priceFrom ? money(d.priceFrom) : '—',
                <AppPresence
                  key="s"
                  seenAt={d.lastAppSeenAt}
                  platform={d.lastAppPlatform}
                  mustChangePassword={d.mustChangePassword}
                />,
                ...(canManage
                  ? [
                      <div key="e" className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(d)}
                          aria-label={t('crm.doctors.edit.open')}
                          title={t('crm.doctors.edit.open')}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-primary-muted hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemoving(d)}
                          aria-label={t('crm.doctors.remove.open')}
                          title={t('crm.doctors.remove.open')}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>,
                    ]
                  : []),
              ])}
            />
          )}
        </Panel>
      </CrmQueryState>

      <AddDoctorModal open={addOpen} onClose={closeAdd} onCreated={reload} />
      <EditDoctorModal doctor={editing} onClose={closeEdit} onSaved={reload} />
      <RemoveDoctorModal doctor={removing} onClose={closeRemove} onRemoved={reload} />
    </AppShell>
  );
}
