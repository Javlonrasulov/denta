'use client';

import {
  AlertTriangle,
  Ban,
  CalendarClock,
  Check,
  CircleDollarSign,
  Clock3,
  FileSignature,
  History,
  Loader2,
  Paperclip,
  PiggyBank,
  Plus,
  ReceiptText,
  RotateCcw,
  Wallet,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  doctorFinanceApi,
  type DoctorFinanceDetail,
  type RentObligation,
  type RentPayment,
} from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { cn } from '@/lib/cn';
import {
  modelLabel,
  OBLIGATION_TONE,
  rentRuleSummary,
  ROW_STATUS_TONE,
  financeErrorText,
  type DoctorFinanceAccess,
} from '@/lib/doctor-finance';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

import { AgreementModal } from './AgreementModal';
import { StatusPill } from './fields';
import { OpeningBalanceModal } from './OpeningBalanceModal';
import { ReasonModal } from './ReasonModal';
import { RentPaymentModal } from './RentPaymentModal';

type Reason =
  | { kind: 'void'; payment: RentPayment }
  | { kind: 'reject'; payment: RentPayment }
  | { kind: 'cancel'; obligation: RentObligation };

type TimelineItem =
  | { type: 'obligation'; date: string; sortKey: string; item: RentObligation }
  | { type: 'payment'; date: string; sortKey: string; item: RentPayment };

const P = 'crm.doctor_finance';

export function DoctorFinanceTab({
  doctorId,
  access,
  workingDays,
}: {
  doctorId: string;
  access: DoctorFinanceAccess;
  workingDays?: number[];
}) {
  const { t, money, date } = useCrmI18n();
  const [detail, setDetail] = useState<DoctorFinanceDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [openingOpen, setOpeningOpen] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [filter, setFilter] = useState<'all' | 'obligations' | 'payments'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setDetail(await doctorFinanceApi.detail(token, doctorId));
    } catch (err) {
      setError(financeErrorText(t, err));
    } finally {
      setLoading(false);
    }
  }, [doctorId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!detail) return [];
    const items: TimelineItem[] = [];
    if (filter !== 'payments') {
      for (const o of detail.obligations) {
        items.push({ type: 'obligation', date: o.dueDate, sortKey: `${o.dueDate}~0`, item: o });
      }
    }
    if (filter !== 'obligations') {
      for (const p of detail.payments) {
        items.push({ type: 'payment', date: p.paidDate, sortKey: `${p.paidDate}~1${p.createdAt}`, item: p });
      }
    }
    return items.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [detail, filter]);

  async function confirmSubmission(payment: RentPayment) {
    const token = readPersistedSession()?.accessToken;
    if (!token || !detail) return;
    setBusyId(payment.id);
    setActionError('');
    try {
      setDetail(await doctorFinanceApi.confirmPayment(token, detail.doctor.doctorId, payment.id));
    } catch (err) {
      setActionError(financeErrorText(t, err));
    } finally {
      setBusyId(null);
    }
  }

  async function openReceipt(url: string) {
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    const win = window.open('', '_blank');
    try {
      const blob = await doctorFinanceApi.receiptBlob(token, url);
      const objectUrl = URL.createObjectURL(blob);
      if (win) win.location.href = objectUrl;
      else window.open(objectUrl, '_blank');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (err) {
      win?.close();
      setActionError(financeErrorText(t, err));
    }
  }

  if (loading && !detail) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (error || !detail) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        {error || t(`${P}.errors.generic`)}
        <button type="button" onClick={() => void load()} className="ml-3 font-semibold underline">
          {t(`${P}.retry`)}
        </button>
      </div>
    );
  }

  const { summary, agreement } = detail;
  const pending = detail.payments.filter((p) => p.status === 'SUBMITTED');
  const share = detail.revenueShare;
  const showShare =
    (agreement && agreement.model !== 'CLINIC_REVENUE' && agreement.model !== 'DOCTOR_REVENUE_PLUS_RENT') ||
    share.allTime.collectedUzs !== 0;
  const canEditAgreement = access.agreement && detail.doctor.isActive;
  const canPay =
    access.payment && (Boolean(agreement?.rent) || summary.totalDebtUzs > 0 || summary.upcomingUzs > 0);
  const payButton = canPay ? (
    <button
      type="button"
      onClick={() => setPayOpen(true)}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-indigo-700"
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} />
      {t(`${P}.record_payment`)}
    </button>
  ) : null;
  const openingButton = access.manage ? (
    <button
      type="button"
      onClick={() => setOpeningOpen(true)}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      <CircleDollarSign className="h-4 w-4" />
      {t(`${P}.add_opening`)}
    </button>
  ) : null;

  return (
    <div className="space-y-5">
      {!detail.doctor.isActive ? (
        <Banner tone="slate" icon={History}>
          {t(`${P}.inactive_banner`, {
            date: detail.doctor.endedAt ? date(detail.doctor.endedAt) : '—',
          })}
        </Banner>
      ) : null}

      {!detail.configured ? (
        <section className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-5">
          <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-slate-900">{t(`${P}.not_configured`)}</p>
              <p className="mt-0.5 text-sm text-slate-600">{t(`${P}.not_configured_hint`)}</p>
            </div>
            {canEditAgreement ? (
              <button
                type="button"
                onClick={() => setAgreementOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-indigo-700"
              >
                <FileSignature className="h-4 w-4" />
                {t(`${P}.configure`)}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {agreement ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <div className="flex flex-col gap-4 laptop:flex-row laptop:items-start">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold text-slate-900">
                  {modelLabel(t, agreement.model)}
                </span>
                <StatusPill tone={ROW_STATUS_TONE[summary.status]}>
                  {t(`${P}.row_status.${summary.status}`)}
                </StatusPill>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                  v{agreement.version}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                {agreement.rent ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4 text-slate-400" />
                    {rentRuleSummary(t, money, agreement.rent)}
                  </span>
                ) : null}
                {agreement.model === 'REVENUE_SHARE' || agreement.model === 'CUSTOM' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <PiggyBank className="h-4 w-4 text-slate-400" />
                    {t(`${P}.share_line`, {
                      clinic: agreement.clinicPercent,
                      doctor: agreement.doctorPercent,
                    })}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-slate-400" />
                  {t(`${P}.effective_since`, { date: date(agreement.effectiveFrom) })}
                </span>
                {agreement.rent?.graceDays ? (
                  <span>{t(`${P}.grace_line`, { count: agreement.rent.graceDays })}</span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {payButton}
              {canEditAgreement ? (
                <button
                  type="button"
                  onClick={() => setAgreementOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FileSignature className="h-4 w-4" />
                  {t(`${P}.change_agreement`)}
                </button>
              ) : null}
              {openingButton}
            </div>
          </div>
        </section>
      ) : payButton || openingButton ? (
        <div className="flex flex-wrap justify-end gap-2">
          {payButton}
          {openingButton}
        </div>
      ) : null}

      {(agreement?.rent || summary.totalDebtUzs > 0 || summary.advanceUzs > 0) && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 laptop:grid-cols-4">
            <Kpi
              label={t(`${P}.kpi.debt`)}
              value={money(summary.totalDebtUzs)}
              tone={summary.totalDebtUzs > 0 ? 'text-rose-600' : 'text-slate-900'}
              icon={Wallet}
            />
            <Kpi
              label={t(`${P}.kpi.overdue`)}
              value={money(summary.overdueUzs)}
              tone={summary.overdueUzs > 0 ? 'text-rose-600' : 'text-slate-900'}
              icon={AlertTriangle}
            />
            <Kpi
              label={t(`${P}.kpi.next_due`)}
              value={summary.nextDue ? money(summary.nextDue.amountUzs) : '—'}
              hint={summary.nextDue ? date(summary.nextDue.date) : t(`${P}.kpi.no_next`)}
              icon={CalendarClock}
            />
            <Kpi
              label={t(`${P}.kpi.advance`)}
              value={money(summary.advanceUzs)}
              tone={summary.advanceUzs > 0 ? 'text-emerald-600' : 'text-slate-900'}
              icon={PiggyBank}
            />
          </div>
          {summary.totalDebtUzs > 0 ? <AgingBar aging={summary.aging} /> : null}
        </>
      )}

      {pending.length ? (
        <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
          <p className="text-sm font-semibold text-slate-900">
            {t(`${P}.pending_title`, { count: pending.length })}
          </p>
          <ul className="mt-3 space-y-2">
            {pending.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-sky-100 tablet:flex-row tablet:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tabular-nums text-slate-900">
                    {money(p.amountUzs)} · {t(`${P}.methods.${p.method}`)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {date(p.paidDate)}
                    {p.note ? ` · ${p.note}` : ''}
                  </p>
                </div>
                {access.payment ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => void confirmSubmission(p)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" />
                      {t(`${P}.confirm`)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReason({ kind: 'reject', payment: p })}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                      {t(`${P}.reject`)}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {actionError ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {actionError}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 tablet:flex-row tablet:items-center tablet:justify-between">
          <h3 className="text-section-title text-slate-900">{t(`${P}.timeline`)}</h3>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {(['all', 'obligations', 'payments'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {t(`${P}.timeline_filter.${f}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 py-4">
          {timeline.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">{t(`${P}.timeline_empty`)}</p>
          ) : (
            <ol className="relative space-y-1">
              <span className="absolute bottom-3 left-[15px] top-3 w-px bg-slate-200" aria-hidden />
              {timeline.map((entry) =>
                entry.type === 'obligation' ? (
                  <ObligationRow
                    key={`o-${entry.item.id}`}
                    o={entry.item}
                    canCancel={access.manage}
                    onCancel={() => setReason({ kind: 'cancel', obligation: entry.item })}
                  />
                ) : (
                  <PaymentRow
                    key={`p-${entry.item.id}`}
                    p={entry.item}
                    canVoid={access.manage}
                    onVoid={() => setReason({ kind: 'void', payment: entry.item })}
                    onReceipt={openReceipt}
                  />
                ),
              )}
            </ol>
          )}
        </div>
      </section>

      {showShare ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-section-title text-slate-900">{t(`${P}.share.title`)}</h3>
            <span className="text-xs text-slate-400">{t(`${P}.share.only_paid`)}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Kpi label={t(`${P}.share.collected_month`)} value={money(share.month.collectedUzs)} />
            <Kpi label={t(`${P}.share.clinic_month`)} value={money(share.month.clinicShareUzs)} />
            <Kpi label={t(`${P}.share.doctor_month`)} value={money(share.month.doctorShareUzs)} />
          </div>
          {share.allTime.clinicOwesDoctorUzs > 0 || share.allTime.doctorOwesClinicUzs > 0 ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {share.allTime.clinicOwesDoctorUzs > 0 ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {t(`${P}.share.clinic_owes`, { amount: money(share.allTime.clinicOwesDoctorUzs) })}
                </p>
              ) : null}
              {share.allTime.doctorOwesClinicUzs > 0 ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {t(`${P}.share.doctor_owes`, { amount: money(share.allTime.doctorOwesClinicUzs) })}
                </p>
              ) : null}
            </div>
          ) : null}
          {share.entries.length ? (
            <ul className="mt-4 divide-y divide-slate-100">
              {share.entries.slice(0, 10).map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                      e.kind === 'REVERSAL' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600',
                    )}
                  >
                    {e.kind === 'REVERSAL' ? <RotateCcw className="h-3.5 w-3.5" /> : <ReceiptText className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-slate-700">
                    {[e.patientName, e.serviceName].filter(Boolean).join(' · ') || '—'}
                    <span className="ml-2 text-xs text-slate-400">{date(e.occurredAt)}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                    {t(`${P}.share.entry`, {
                      clinic: money(e.clinicShareUzs),
                      doctor: money(e.doctorShareUzs),
                    })}
                  </span>
                  <span
                    className={cn(
                      'w-28 shrink-0 text-right font-semibold tabular-nums',
                      e.amountUzs < 0 ? 'text-rose-600' : 'text-slate-900',
                    )}
                  >
                    {money(e.amountUzs)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">{t(`${P}.share.empty`)}</p>
          )}
        </section>
      ) : null}

      {detail.history && detail.history.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
          <h3 className="text-section-title text-slate-900">{t(`${P}.history`)}</h3>
          <ol className="mt-3 space-y-2">
            {detail.history.map((a) => (
              <li
                key={a.id}
                className={cn(
                  'flex flex-col gap-1 rounded-xl px-3.5 py-2.5 tablet:flex-row tablet:items-center tablet:gap-3',
                  a.status === 'ACTIVE' ? 'bg-primary-muted/40 ring-1 ring-primary/15' : 'bg-slate-50',
                )}
              >
                <span className="w-10 shrink-0 text-xs font-bold text-slate-500">v{a.version}</span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold text-slate-900">{modelLabel(t, a.model)}</span>
                  {a.rent ? (
                    <span className="ml-2 text-slate-500">{rentRuleSummary(t, money, a.rent)}</span>
                  ) : null}
                  {a.model === 'REVENUE_SHARE' || a.model === 'CUSTOM' ? (
                    <span className="ml-2 text-slate-500">
                      {t(`${P}.share_line`, { clinic: a.clinicPercent, doctor: a.doctorPercent })}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-slate-500">
                  {date(a.effectiveFrom)} – {a.effectiveTo ? date(a.effectiveTo) : t(`${P}.open_ended`)}
                </span>
                <StatusPill
                  tone={
                    a.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
                      : 'bg-slate-100 text-slate-500 ring-slate-500/15'
                  }
                >
                  {t(`${P}.agreement_status.${a.status}`)}
                </StatusPill>
                {a.createdBy ? <span className="text-xs text-slate-400">{a.createdBy}</span> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <RentPaymentModal open={payOpen} onClose={() => setPayOpen(false)} detail={detail} onSaved={setDetail} />
      <AgreementModal
        open={agreementOpen}
        onClose={() => setAgreementOpen(false)}
        detail={detail}
        workingDays={workingDays}
        onSaved={setDetail}
      />
      <OpeningBalanceModal
        open={openingOpen}
        onClose={() => setOpeningOpen(false)}
        detail={detail}
        onSaved={setDetail}
      />
      <ReasonModal
        open={Boolean(reason)}
        onClose={() => setReason(null)}
        title={reason ? t(`${P}.reason_modal.${reason.kind}.title`) : ''}
        description={reason ? t(`${P}.reason_modal.${reason.kind}.description`) : ''}
        confirmLabel={reason ? t(`${P}.reason_modal.${reason.kind}.confirm`) : ''}
        onConfirm={async (text) => {
          const token = readPersistedSession()?.accessToken;
          if (!token || !reason) return;
          const id = detail.doctor.doctorId;
          const next =
            reason.kind === 'void'
              ? await doctorFinanceApi.voidPayment(token, id, reason.payment.id, text)
              : reason.kind === 'reject'
                ? await doctorFinanceApi.rejectPayment(token, id, reason.payment.id, text)
                : await doctorFinanceApi.cancelObligation(token, id, reason.obligation.id, text);
          setDetail(next);
        }}
      />
    </div>
  );
}

function Banner({
  tone,
  icon: Icon,
  children,
}: {
  tone: 'slate' | 'amber';
  icon: typeof History;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl p-3.5 text-sm ring-1',
        tone === 'slate' ? 'bg-slate-50 text-slate-700 ring-slate-200' : 'bg-amber-50 text-amber-800 ring-amber-200',
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone = 'text-slate-900',
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
  icon?: typeof Wallet;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {Icon ? <Icon className="h-3.5 w-3.5 text-slate-400" /> : null}
        {label}
      </p>
      <p className={cn('mt-1.5 text-xl font-semibold tabular-nums tracking-tight', tone)}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

function AgingBar({ aging }: { aging: DoctorFinanceDetail['summary']['aging'] }) {
  const { t, money } = useCrmI18n();
  const buckets = [
    { key: 'd0_7', value: aging.d0_7, color: 'bg-amber-300' },
    { key: 'd8_30', value: aging.d8_30, color: 'bg-orange-400' },
    { key: 'd31_60', value: aging.d31_60, color: 'bg-rose-500' },
    { key: 'd60_plus', value: aging.d60_plus, color: 'bg-rose-700' },
  ] as const;
  const total = buckets.reduce((s, b) => s + b.value, 0) || 1;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
      <p className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-400">
        {t(`${P}.aging.title`)}
      </p>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        {buckets.map((b) =>
          b.value > 0 ? (
            <div key={b.key} className={b.color} style={{ width: `${(b.value / total) * 100}%` }} />
          ) : null,
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 tablet:grid-cols-4">
        {buckets.map((b) => (
          <div key={b.key} className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', b.color)} />
            <span className="min-w-0">
              <span className="block text-[11px] text-slate-500">{t(`${P}.aging.${b.key}`)}</span>
              <span className="block text-sm font-semibold tabular-nums text-slate-900">{money(b.value)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ObligationRow({
  o,
  canCancel,
  onCancel,
}: {
  o: RentObligation;
  canCancel: boolean;
  onCancel: () => void;
}) {
  const { t, money, date } = useCrmI18n();
  const cancelled = o.status === 'CANCELLED';
  const pct = o.amountUzs > 0 ? Math.min(100, Math.round((o.paidUzs / o.amountUzs) * 100)) : 0;
  const dot =
    o.status === 'PAID'
      ? 'bg-emerald-500'
      : o.status === 'OVERDUE'
        ? 'bg-rose-500'
        : o.status === 'CANCELLED'
          ? 'bg-slate-300'
          : o.status === 'PARTIALLY_PAID'
            ? 'bg-violet-500'
            : o.status === 'DUE'
              ? 'bg-amber-500'
              : 'bg-sky-400';
  const period =
    o.kind === 'OPENING_BALANCE'
      ? t(`${P}.opening_label`)
      : o.periodStart === o.periodEnd
        ? date(o.periodStart)
        : `${date(o.periodStart)} – ${date(o.periodEnd)}`;
  return (
    <li className="relative flex gap-3 rounded-xl py-2.5 pl-0 pr-1 transition hover:bg-slate-50/70">
      <span className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
        <span className={cn('h-2.5 w-2.5 rounded-full', dot)} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('text-sm font-semibold', cancelled ? 'text-slate-400 line-through' : 'text-slate-900')}>
            {o.kind === 'OPENING_BALANCE' ? t(`${P}.opening_label`) : t(`${P}.rent_label`)}
          </span>
          <StatusPill tone={OBLIGATION_TONE[o.status]}>{t(`${P}.ob_status.${o.status}`)}</StatusPill>
          {o.status === 'OVERDUE' ? (
            <span className="text-xs font-semibold text-rose-600">
              {t(`${P}.days_overdue`, { count: o.daysOverdue })}
            </span>
          ) : null}
          {o.prorated ? (
            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
              {t(`${P}.prorated`)}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {o.kind === 'OPENING_BALANCE' ? date(o.dueDate) : period}
          {o.kind !== 'OPENING_BALANCE' ? ` · ${t(`${P}.due_on`, { date: date(o.dueDate) })}` : ''}
          {o.note ? ` · ${o.note}` : ''}
        </p>
        {cancelled ? (
          <p className="mt-1 text-xs text-slate-400">
            {t(`${P}.cancelled_line`, { reason: o.cancelReason ?? '—', by: o.cancelledBy ?? '—' })}
          </p>
        ) : o.paidUzs > 0 && o.paidUzs < o.amountUzs ? (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] text-slate-500">
              {t(`${P}.paid_of`, { paid: money(o.paidUzs), left: money(o.outstandingUzs) })}
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={cn('text-sm font-semibold tabular-nums', cancelled ? 'text-slate-400 line-through' : 'text-slate-900')}>
          {money(o.amountUzs)}
        </span>
        {canCancel && !cancelled && o.status !== 'PAID' ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Ban className="h-3 w-3" />
            {t(`${P}.cancel_obligation`)}
          </button>
        ) : null}
      </div>
    </li>
  );
}

function PaymentRow({
  p,
  canVoid,
  onVoid,
  onReceipt,
}: {
  p: RentPayment;
  canVoid: boolean;
  onVoid: () => void;
  onReceipt: (url: string) => void;
}) {
  const { t, money, date } = useCrmI18n();
  const voided = p.status === 'VOIDED' || p.status === 'REJECTED';
  const prior = p.kind === 'PRIOR';
  return (
    <li className="relative flex gap-3 rounded-xl py-2.5 pr-1 transition hover:bg-slate-50/70">
      <span
        className={cn(
          'relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1',
          voided
            ? 'bg-slate-50 text-slate-400 ring-slate-200'
            : p.status === 'SUBMITTED'
              ? 'bg-sky-50 text-sky-600 ring-sky-200'
              : 'bg-emerald-50 text-emerald-600 ring-emerald-200',
        )}
      >
        {prior ? <History className="h-4 w-4" /> : <ReceiptText className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('text-sm font-semibold', voided ? 'text-slate-400 line-through' : 'text-slate-900')}>
            {t(prior ? `${P}.prior_payment_label` : `${P}.payment_label`)}
          </span>
          <span className="text-xs text-slate-500">{t(`${P}.methods.${p.method}`)}</span>
          {p.status !== 'CONFIRMED' ? (
            <StatusPill
              tone={
                p.status === 'SUBMITTED'
                  ? 'bg-sky-50 text-sky-700 ring-sky-600/15'
                  : 'bg-slate-100 text-slate-500 ring-slate-500/15'
              }
            >
              {t(`${P}.pay_status.${p.status}`)}
            </StatusPill>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {date(p.paidDate)}
          {p.createdBy ? ` · ${p.createdBy}` : ''}
          {p.note ? ` · ${p.note}` : ''}
        </p>
        {prior && (p.coveredFrom || p.coveredTo) ? (
          <p className="mt-0.5 text-xs text-slate-500">
            {t(`${P}.covered`, {
              from: p.coveredFrom ? date(p.coveredFrom) : '…',
              to: p.coveredTo ? date(p.coveredTo) : '…',
            })}
          </p>
        ) : null}
        {!voided && p.allocations.length ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {p.allocations.map((a) => (
              <span
                key={a.obligationId}
                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
              >
                {a.kind === 'OPENING_BALANCE' ? t(`${P}.opening_label`) : date(a.dueDate)} ·{' '}
                <span className="font-semibold tabular-nums">{money(a.amountUzs)}</span>
              </span>
            ))}
            {p.unallocatedUzs > 0 ? (
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700">
                {t(`${P}.advance_chip`, { amount: money(p.unallocatedUzs) })}
              </span>
            ) : null}
          </div>
        ) : null}
        {voided && p.voidReason ? (
          <p className="mt-1 text-xs text-slate-400">
            {t(`${P}.voided_line`, { reason: p.voidReason, by: p.voidedBy ?? '—' })}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            voided ? 'text-slate-400 line-through' : 'text-emerald-600',
          )}
        >
          +{money(p.amountUzs)}
        </span>
        <div className="flex items-center gap-1">
          {p.attachmentUrl ? (
            <button
              type="button"
              onClick={() => onReceipt(p.attachmentUrl!)}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary-muted"
            >
              <Paperclip className="h-3 w-3" />
              {t(`${P}.receipt`)}
            </button>
          ) : null}
          {canVoid && p.status === 'CONFIRMED' ? (
            <button
              type="button"
              onClick={onVoid}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <Ban className="h-3 w-3" />
              {t(`${P}.void`)}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
