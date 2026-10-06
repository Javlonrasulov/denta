'use client';

import { Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Panel } from '@/components/ui/crm';
import { DatePicker } from '@/components/ui/DatePicker';
import { doctorFinanceApi, type DoctorRentReport as Report } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { cn } from '@/lib/cn';
import { financeErrorText, modelLabel, ROW_STATUS_TONE, todayLocalYmd } from '@/lib/doctor-finance';
import { endOfMonth, startOfMonth } from '@/lib/doctor-finance/dates';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

import { FieldLabel, StatusPill } from './fields';

const STATUSES = ['all', 'paid', 'pending', 'debtor', 'overdue'] as const;
const P = 'crm.doctor_finance';

/**
 * Excel-friendly CSV: BOM + `;` separator + quoted cells; amounts stay plain integers (UZS).
 * Text starting with = + - @ is prefixed with ' so spreadsheets never evaluate it as a formula.
 */
function toCsv(rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return `\uFEFF${rows.map((r) => r.map(cell).join(';')).join('\r\n')}`;
}

export function DoctorRentReport() {
  const { t, money } = useCrmI18n();
  const today = todayLocalYmd();
  const [from, setFrom] = useState(startOfMonth(today));
  const [to, setTo] = useState(endOfMonth(today));
  const [doctorId, setDoctorId] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('all');
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState('');
  /** Browser "today" is only a first guess; the clinic's timezone (from the API) wins until the user picks dates. */
  const rangeTouched = useRef(false);

  useEffect(() => {
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    doctorFinanceApi
      .overview(token)
      .then((o) => {
        setDoctors(o.rows.map((r) => ({ id: r.doctorId, name: r.name })));
        if (!rangeTouched.current && o.today !== today) {
          setFrom(startOfMonth(o.today));
          setTo(endOfMonth(o.today));
        }
      })
      .catch(() => undefined);
  }, [today]);

  useEffect(() => {
    const token = readPersistedSession()?.accessToken;
    if (!token || to < from) return;
    let cancelled = false;
    doctorFinanceApi
      .report(token, { from, to, doctorId: doctorId || undefined, status })
      .then((r) => {
        if (!cancelled) {
          setData(r);
          setError('');
        }
      })
      .catch((err) => !cancelled && setError(financeErrorText(t, err)));
    return () => {
      cancelled = true;
    };
  }, [from, to, doctorId, status, t]);

  function exportCsv() {
    if (!data) return;
    const c = `${P}.report.col`;
    const rows: (string | number)[][] = [
      [
        t(`${c}.doctor`),
        t(`${c}.model`),
        t(`${c}.status`),
        t(`${c}.accrued`),
        t(`${c}.paid`),
        t(`${c}.debt`),
        t(`${c}.overdue`),
        t(`${c}.advance`),
        t(`${c}.revenue`),
        t(`${c}.clinic_share`),
        t(`${c}.doctor_share`),
      ],
      ...data.rows.map((r) => [
        r.name,
        modelLabel(t, r.model),
        t(`${P}.row_status.${r.status}`),
        r.accruedUzs,
        r.paidUzs,
        r.debtUzs,
        r.overdueUzs,
        r.advanceUzs,
        r.revenueCollectedUzs,
        r.revenueClinicShareUzs,
        r.revenueDoctorShareUzs,
      ]),
      [
        t(`${P}.report.total`),
        '',
        '',
        data.totals.accruedUzs,
        data.totals.paidUzs,
        data.totals.debtUzs,
        data.totals.overdueUzs,
        '',
        data.totals.revenueCollectedUzs,
        data.totals.revenueClinicShareUzs,
        data.totals.revenueDoctorShareUzs,
      ],
    ];
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctor-rent_${data.from}_${data.to}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const tot = data?.totals;

  return (
    <Panel
      title={t(`${P}.report.title`)}
      action={
        <button
          type="button"
          onClick={exportCsv}
          disabled={!data || data.rows.length === 0}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
      }
    >
      <div className="grid gap-3 tablet:grid-cols-2 laptop:grid-cols-4">
        <DatePicker
          label={t(`${P}.report.from`)}
          value={from}
          max={to}
          onChange={(v) => {
            rangeTouched.current = true;
            setFrom(v);
          }}
        />
        <DatePicker
          label={t(`${P}.report.to`)}
          value={to}
          min={from}
          onChange={(v) => {
            rangeTouched.current = true;
            setTo(v);
          }}
        />
        <div className="space-y-1.5">
          <FieldLabel>{t(`${P}.report.doctor`)}</FieldLabel>
          <select
            aria-label={t(`${P}.report.doctor`)}
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-primary focus:bg-white"
          >
            <option value="">{t(`${P}.report.all_doctors`)}</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <FieldLabel>{t(`${P}.report.status`)}</FieldLabel>
          <select
            aria-label={t(`${P}.report.status`)}
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-primary focus:bg-white"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`${P}.rents.filter.${s}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 laptop:grid-cols-5">
        <Metric label={t(`${P}.report.col.accrued`)} value={tot ? money(tot.accruedUzs) : '—'} />
        <Metric label={t(`${P}.report.col.paid`)} value={tot ? money(tot.paidUzs) : '—'} tone="text-emerald-600" />
        <Metric
          label={t(`${P}.report.col.debt`)}
          value={tot ? money(tot.debtUzs) : '—'}
          tone={tot && tot.debtUzs > 0 ? 'text-rose-600' : undefined}
        />
        <Metric label={t(`${P}.report.col.revenue`)} value={tot ? money(tot.revenueCollectedUzs) : '—'} />
        <Metric label={t(`${P}.report.col.doctor_share`)} value={tot ? money(tot.revenueDoctorShareUzs) : '—'} />
      </div>

      <div className="mt-4 overflow-x-auto">
        {data && data.rows.length ? (
          <table className="min-w-full text-left text-table-cell">
            <thead>
              <tr className="border-b border-slate-100 text-table-head uppercase text-slate-400">
                <th className="px-3 py-2.5">{t(`${P}.report.col.doctor`)}</th>
                <th className="px-3 py-2.5">{t(`${P}.report.col.status`)}</th>
                <th className="px-3 py-2.5 text-right">{t(`${P}.report.col.accrued`)}</th>
                <th className="px-3 py-2.5 text-right">{t(`${P}.report.col.paid`)}</th>
                <th className="px-3 py-2.5 text-right">{t(`${P}.report.col.debt`)}</th>
                <th className="px-3 py-2.5 text-right">{t(`${P}.report.col.revenue`)}</th>
                <th className="px-3 py-2.5 text-right">{t(`${P}.report.col.doctor_share`)}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {data.rows.map((r) => (
                <tr key={r.doctorId} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-500">{modelLabel(t, r.model)}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusPill tone={ROW_STATUS_TONE[r.status]}>{t(`${P}.row_status.${r.status}`)}</StatusPill>
                  </td>
                  <td className="px-3 py-2.5 text-right">{money(r.accruedUzs)}</td>
                  <td className="px-3 py-2.5 text-right text-emerald-700">{money(r.paidUzs)}</td>
                  <td className={cn('px-3 py-2.5 text-right', r.debtUzs > 0 && 'font-semibold text-rose-600')}>
                    {money(r.debtUzs)}
                  </td>
                  <td className="px-3 py-2.5 text-right">{money(r.revenueCollectedUzs)}</td>
                  <td className="px-3 py-2.5 text-right">{money(r.revenueDoctorShareUzs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">{data ? t(`${P}.rents.empty`) : '…'}</p>
        )}
      </div>
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
