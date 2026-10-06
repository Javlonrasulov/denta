'use client';

import { AlertTriangle, BellRing, ChevronRight, Search, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Panel } from '@/components/ui/crm';
import { doctorFinanceApi, type DoctorRentOverview } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { cn } from '@/lib/cn';
import {
  complementPercent,
  financeErrorText,
  modelLabel,
  rentRuleSummary,
  ROW_STATUS_TONE,
  type DoctorFinanceAccess,
} from '@/lib/doctor-finance';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

import { StatusPill } from './fields';
import { ReminderSettingsModal } from './ReminderSettingsModal';

const FILTERS = ['all', 'paid', 'pending', 'debtor', 'overdue'] as const;
type Filter = (typeof FILTERS)[number];
const P = 'crm.doctor_finance';

export function DoctorRentsPanel({ access }: { access: DoctorFinanceAccess }) {
  const { t, money, date } = useCrmI18n();
  const [data, setData] = useState<DoctorRentOverview | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [remindersOpen, setRemindersOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setQuery(q.trim()), 250);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    let cancelled = false;
    doctorFinanceApi
      .overview(token, { status: filter, q: query || undefined })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError('');
        }
      })
      .catch((err) => !cancelled && setError(financeErrorText(t, err)));
    return () => {
      cancelled = true;
    };
  }, [filter, query, t]);

  const m = data?.metrics;

  return (
    <Panel
      title={t(`${P}.rents.title`)}
      action={
        <button
          type="button"
          onClick={() => setRemindersOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <BellRing className="h-4 w-4" />
          <span className="hidden tablet:inline">{t(`${P}.reminders.open`)}</span>
        </button>
      }
    >
      {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}

      {data && data.missingAgreements > 0 ? (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-amber-50/80 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>{t(`${P}.list_banner`, { count: data.missingAgreements })}</span>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 laptop:grid-cols-5">
        <Metric label={t(`${P}.rents.expected`)} value={m ? money(m.expectedThisMonthUzs) : '—'} />
        <Metric label={t(`${P}.rents.paid`)} value={m ? money(m.paidThisMonthUzs) : '—'} tone="text-emerald-600" />
        <Metric label={t(`${P}.rents.remaining`)} value={m ? money(m.remainingThisMonthUzs) : '—'} />
        <Metric
          label={t(`${P}.rents.overdue`)}
          value={m ? money(m.overdueUzs) : '—'}
          tone={m && m.overdueUzs > 0 ? 'text-rose-600' : undefined}
        />
        <Metric label={t(`${P}.rents.next7`)} value={m ? money(m.next7DaysUzs) : '—'} />
      </div>

      <div className="mt-5 flex flex-col gap-3 laptop:flex-row laptop:items-center laptop:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition',
                filter === f ? 'bg-slate-900 text-white dark:bg-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {t(`${P}.rents.filter.${f}`)}
              {data ? (
                <span className={cn('tabular-nums', filter === f ? 'text-white/70' : 'text-slate-400')}>
                  {f === 'debtor' ? data.counts.debtor + data.counts.overdue : data.counts[f]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 laptop:w-64">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t(`${P}.rents.search`)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </label>
      </div>

      <div className="mt-4 overflow-x-auto">
        {!data ? (
          <p className="py-6 text-center text-sm text-slate-400">…</p>
        ) : data.rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">{t(`${P}.rents.empty`)}</p>
        ) : (
          <table className="min-w-full text-left text-table-cell">
            <thead>
              <tr className="border-b border-slate-100 text-table-head uppercase text-slate-400">
                <th className="px-3 py-2.5">{t(`${P}.rents.col.doctor`)}</th>
                <th className="px-3 py-2.5">{t(`${P}.rents.col.agreement`)}</th>
                <th className="px-3 py-2.5">{t(`${P}.rents.col.next`)}</th>
                <th className="px-3 py-2.5 text-right">{t(`${P}.rents.col.debt`)}</th>
                <th className="px-3 py-2.5">{t(`${P}.rents.col.status`)}</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.doctorClinicId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-3 py-3">
                    <div className="flex min-w-[180px] items-center gap-3">
                      {r.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photoUrl} alt="" className="h-9 w-9 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
                          <Stethoscope className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{r.name}</p>
                        {!r.isActive ? (
                          <p className="text-[11px] text-slate-400">{t(`${P}.rents.left_clinic`)}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-800">{modelLabel(t, r.agreement?.model)}</p>
                    {r.agreement?.recurrence ? (
                      <p className="text-xs text-slate-500">{rentRuleSummary(t, money, r.agreement)}</p>
                    ) : r.agreement && (r.agreement.model === 'REVENUE_SHARE' || r.agreement.model === 'CUSTOM') ? (
                      <p className="text-xs text-slate-500">
                        {t(`${P}.share_line`, {
                          clinic: r.agreement.clinicPercent,
                          doctor: complementPercent(r.agreement.clinicPercent),
                        })}
                      </p>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {r.nextDue ? (
                      <>
                        <p className="font-medium text-slate-800">{date(r.nextDue.date)}</p>
                        <p className="text-xs tabular-nums text-slate-500">{money(r.nextDue.amountUzs)}</p>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <p
                      className={cn(
                        'font-semibold tabular-nums',
                        r.debtUzs > 0 ? 'text-rose-600' : 'text-slate-900',
                      )}
                    >
                      {money(r.debtUzs)}
                    </p>
                    {r.advanceUzs > 0 ? (
                      <p className="text-xs tabular-nums text-emerald-600">
                        {t(`${P}.advance_chip`, { amount: money(r.advanceUzs) })}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill tone={ROW_STATUS_TONE[r.status]}>{t(`${P}.row_status.${r.status}`)}</StatusPill>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/doctors/${encodeURIComponent(r.doctorId)}?tab=finance`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary-muted"
                    >
                      {t(access.payment ? `${P}.rents.open_pay` : `${P}.rents.open`)}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ReminderSettingsModal
        open={remindersOpen}
        onClose={() => setRemindersOpen(false)}
        canEdit={access.manage}
      />
    </Panel>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3.5 py-3">
      <p className="truncate text-xs font-medium text-slate-500">{label}</p>
      <p className={cn('mt-1 truncate text-lg font-semibold tabular-nums', tone ?? 'text-slate-900')}>{value}</p>
    </div>
  );
}
