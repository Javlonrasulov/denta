'use client';

import { AlertCircle, Building2, Check, History, UserCheck, UserSearch, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ScheduleSummary } from '@/components/doctors/ScheduleSummary';
import { cn } from '@/lib/cn';
import type { DoctorLookupMatch } from '@/lib/api/clinic-api';

export type LookupSource = 'phone' | 'name';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function DoctorAvatar({ match, size = 'md' }: { match: DoctorLookupMatch; size?: 'sm' | 'md' }) {
  const initials = `${match.firstName.charAt(0)}${match.lastName.charAt(0)}`.toUpperCase();
  const box = size === 'md' ? 'h-12 w-12 rounded-2xl text-base' : 'h-9 w-9 rounded-xl text-sm';
  return match.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={match.photoUrl} alt="" className={cn('shrink-0 object-cover', box)} />
  ) : (
    <div className={cn('flex shrink-0 items-center justify-center bg-primary font-semibold text-white', box)}>
      {initials}
    </div>
  );
}

export function DoctorLookupCard({
  match,
  source,
  onUse,
  onReject,
}: {
  match: DoctorLookupMatch;
  source: LookupSource;
  onUse: () => void;
  onReject: () => void;
}) {
  const { t } = useTranslation();
  const current = match.clinics.filter((c) => c.current && !c.isThisClinic);
  const meta = [
    match.specialty,
    match.experienceYears > 0 ? t('crm.doctors.years_short', { count: match.experienceYears }) : null,
    match.phoneMasked,
  ].filter(Boolean);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border shadow-sm',
        match.alreadyHere ? 'border-rose-200' : 'border-primary/25',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 text-xs font-semibold',
          match.alreadyHere ? 'bg-rose-50 text-rose-700' : 'bg-primary-muted text-primary',
        )}
      >
        <UserSearch className="h-4 w-4" />
        {source === 'phone' ? t('crm.doctors.lookup.found_phone') : t('crm.doctors.lookup.found_name')}
      </div>

      <div className="space-y-4 bg-white p-4">
        <div className="flex items-center gap-3">
          <DoctorAvatar match={match} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {match.firstName} {match.lastName}
            </p>
            <p className="truncate text-xs text-slate-500">{meta.join(' · ')}</p>
          </div>
        </div>

        {!match.isDoctor ? (
          <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
            {t('crm.doctors.lookup.patient_account')}
          </p>
        ) : match.clinics.length ? (
          <ol className="relative space-y-3 pl-5 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-slate-200">
            {match.clinics.map((c) => (
              <li key={c.clinicId} className="relative">
                <span
                  className={cn(
                    'absolute -left-5 top-1 h-[11px] w-[11px] rounded-full ring-[3px] ring-card',
                    c.current ? 'bg-emerald-500' : 'bg-slate-300',
                  )}
                />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-800">{c.clinicName}</span>
                  {c.isThisClinic ? (
                    <span className="text-[11px] text-slate-400">({t('crm.doctors.lookup.this_clinic')})</span>
                  ) : null}
                  {c.current ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
                      {t('crm.doctors.lookup.works_now')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <History className="h-3 w-3" />
                      {t('crm.doctors.lookup.worked', {
                        from: formatDate(c.startedAt),
                        to: c.endedAt ? formatDate(c.endedAt) : '—',
                      })}
                    </span>
                  )}
                </div>
                {c.current && c.schedule.length ? (
                  <div className="mt-1.5">
                    <ScheduleSummary schedule={c.schedule} tone="success" />
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-slate-500">{t('crm.doctors.lookup.no_history')}</p>
        )}

        {match.alreadyHere ? (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {t('crm.doctors.lookup.already_here')}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">
              {current.length
                ? t('crm.doctors.lookup.question_busy', { clinic: current.map((c) => c.clinicName).join(', ') })
                : t('crm.doctors.lookup.question')}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{t('crm.doctors.lookup.use_hint')}</p>
            <div className="mt-3 flex flex-col-reverse gap-2 tablet:flex-row tablet:justify-end">
              <button
                type="button"
                onClick={onReject}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
                {source === 'phone' ? t('crm.doctors.lookup.other_phone') : t('crm.doctors.lookup.dismiss')}
              </button>
              <button
                type="button"
                onClick={onUse}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <Check className="h-4 w-4" />
                {t('crm.doctors.lookup.use')}
              </button>
            </div>
          </div>
        )}
        {match.alreadyHere ? (
          <button
            type="button"
            onClick={onReject}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {source === 'phone' ? t('crm.doctors.lookup.other_phone') : t('crm.doctors.lookup.hide')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SelectedDoctorBanner({
  match,
  onCancel,
}: {
  match: DoctorLookupMatch;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
      <DoctorAvatar match={match} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
          <UserCheck className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {t('crm.doctors.lookup.selected', { name: `${match.firstName} ${match.lastName}` })}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-emerald-700/80">{t('crm.doctors.lookup.selected_hint')}</p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        {t('crm.doctors.lookup.cancel_selection')}
      </button>
    </div>
  );
}
