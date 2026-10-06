'use client';

import {
  ArrowLeftRight,
  Banknote,
  Building2,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  CircleCheck,
  CircleDollarSign,
  CreditCard,
  History,
  Info,
  KeyRound,
  ListChecks,
  PieChart,
  Plus,
  Repeat,
  SlidersHorizontal,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { DatePicker } from '@/components/ui/DatePicker';
import { ModalSection } from '@/components/users/ModalShell';
import type { DoctorFinanceModel, RentRecurrence } from '@/lib/api/clinic-api';
import { cn } from '@/lib/cn';
import {
  complementPercent,
  hasRent,
  hasShare,
  previewObligations,
  type AgreementErrors,
  type AgreementForm as Form,
  type PriorMode,
} from '@/lib/doctor-finance';
import { addDays } from '@/lib/doctor-finance/dates';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

import {
  FieldError,
  FieldLabel,
  Hint,
  MoneyInput,
  Segmented,
  TextArea,
  Toggle,
} from './fields';

const MODELS: { id: DoctorFinanceModel; icon: LucideIcon; tone: string }[] = [
  { id: 'CLINIC_REVENUE', icon: Building2, tone: 'text-sky-600 bg-sky-50 ring-sky-200' },
  { id: 'DOCTOR_REVENUE_PLUS_RENT', icon: KeyRound, tone: 'text-amber-600 bg-amber-50 ring-amber-200' },
  { id: 'REVENUE_SHARE', icon: PieChart, tone: 'text-violet-600 bg-violet-50 ring-violet-200' },
  { id: 'CUSTOM', icon: SlidersHorizontal, tone: 'text-emerald-600 bg-emerald-50 ring-emerald-200' },
];

const RECURRENCES: { id: RentRecurrence; icon: LucideIcon }[] = [
  { id: 'MONTHLY', icon: CalendarDays },
  { id: 'WEEKLY', icon: CalendarRange },
  { id: 'DAILY', icon: CalendarCheck2 },
  { id: 'INTERVAL', icon: Repeat },
  { id: 'ONE_TIME', icon: CalendarClock },
  { id: 'CUSTOM_SCHEDULE', icon: ListChecks },
];

/** Monday-first order; values are 0=Sun … 6=Sat. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const PRIOR_OPTIONS: { id: PriorMode; icon: LucideIcon }[] = [
  { id: 'none', icon: CircleCheck },
  { id: 'paid', icon: History },
  { id: 'debt', icon: CircleDollarSign },
];

export function AgreementForm({
  form,
  onChange,
  errors,
  today,
  workingDays,
  showBalances = true,
  minEffectiveFrom,
}: {
  form: Form;
  onChange: (patch: Partial<Form>) => void;
  errors: AgreementErrors;
  today: string;
  /** Start of the current version; a new version cannot begin earlier. */
  minEffectiveFrom?: string;
  /** Doctor's working weekdays (0=Sun) for the daily preview. */
  workingDays?: number[];
  showBalances?: boolean;
}) {
  const { t, money, date } = useCrmI18n();
  const p = 'crm.doctor_finance';
  const err = (key: keyof AgreementErrors) =>
    errors[key] ? t(`${p}.errors.${errors[key]}`) : undefined;
  const [advanced, setAdvanced] = useState(false);

  const rent = hasRent(form);
  const share = hasShare(form);
  const preview = useMemo(() => previewObligations(form, workingDays), [form, workingDays]);
  const clinicPct = Number(form.clinicPercent.replace(',', '.'));
  const doctorPct = Number.isFinite(clinicPct) ? Math.max(0, Math.min(100, complementPercent(clinicPct))) : 0;
  const earliestStart = addDays(today, -366);
  const minStart = minEffectiveFrom && minEffectiveFrom > earliestStart ? minEffectiveFrom : earliestStart;

  return (
    <div className="space-y-6">
      <ModalSection title={t(`${p}.section_model`)}>
        <div className="grid gap-2.5 tablet:grid-cols-2">
          {MODELS.map(({ id, icon: Icon, tone }) => {
            const active = form.model === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ model: id })}
                aria-pressed={active}
                className={cn(
                  'group relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition',
                  active
                    ? 'border-primary bg-primary-muted/40 ring-2 ring-primary/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm',
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
                    tone,
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">
                    {t(`${p}.models.${id}.title`)}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                    {t(`${p}.models.${id}.description`)}
                  </span>
                </span>
                {active ? (
                  <CircleCheck className="absolute right-3 top-3 h-4 w-4 text-primary" />
                ) : null}
              </button>
            );
          })}
        </div>
        <FieldError>{err('model')}</FieldError>
      </ModalSection>

      {form.model ? (
        <>
          <ModalSection title={t(`${p}.section_terms`)}>
            <div className="space-y-4">
              <div>
                <DatePicker
                  label={t(`${p}.effective_from`)}
                  value={form.effectiveFrom}
                  min={minStart}
                  max={addDays(today, 366)}
                  onChange={(iso) => onChange({ effectiveFrom: iso })}
                  error={err('effectiveFrom')}
                />
                {!errors.effectiveFrom ? <Hint>{t(`${p}.effective_from_hint`)}</Hint> : null}
              </div>

              {form.model === 'CLINIC_REVENUE' ? (
                <InfoNote>{t(`${p}.models.CLINIC_REVENUE.note`)}</InfoNote>
              ) : null}

              {share ? (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-end gap-3">
                    <div className="w-32">
                      <FieldLabel>{t(`${p}.clinic_percent`)}</FieldLabel>
                      <div className="mt-1.5 flex h-12 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20">
                        <input
                          inputMode="decimal"
                          aria-label={t(`${p}.clinic_percent`)}
                          value={form.clinicPercent}
                          onChange={(e) =>
                            onChange({
                              clinicPercent: e.target.value.replace(/[^\d.,]/g, '').slice(0, 6),
                            })
                          }
                          className="min-w-0 flex-1 bg-transparent text-base font-semibold tabular-nums text-slate-900 outline-none"
                        />
                        <span className="text-sm font-medium text-slate-400">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={Number.isFinite(clinicPct) ? clinicPct : 0}
                      onChange={(e) => onChange({ clinicPercent: e.target.value })}
                      className="mb-4 h-2 flex-1 cursor-pointer accent-primary"
                      aria-label={t(`${p}.clinic_percent`)}
                    />
                  </div>
                  <div className="mt-3 flex overflow-hidden rounded-full bg-slate-100 text-[11px] font-semibold">
                    <div
                      className="bg-primary px-2 py-1 text-white transition-all"
                      style={{ width: `${Math.max(clinicPct || 0, 0)}%` }}
                    >
                      {clinicPct >= 15 ? `${t(`${p}.clinic`)} ${clinicPct}%` : ''}
                    </div>
                    <div className="flex-1 px-2 py-1 text-right text-slate-600">
                      {doctorPct >= 15 ? `${t(`${p}.doctor`)} ${doctorPct}%` : ''}
                    </div>
                  </div>
                  <FieldError>{err('clinicPercent')}</FieldError>
                  {!errors.clinicPercent ? <Hint>{t(`${p}.share_hint`)}</Hint> : null}
                </div>
              ) : null}

              {form.model === 'CUSTOM' ? (
                <Toggle
                  checked={form.customRent}
                  onChange={(v) => onChange({ customRent: v })}
                  label={t(`${p}.custom_rent_toggle`)}
                  description={t(`${p}.custom_rent_toggle_hint`)}
                />
              ) : null}
            </div>
          </ModalSection>

          {rent ? (
            <ModalSection title={t(`${p}.section_rent`)}>
              <div className="space-y-4">
                <div>
                  <FieldLabel>{t(`${p}.recurrence`)}</FieldLabel>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 tablet:grid-cols-3">
                    {RECURRENCES.map(({ id, icon: Icon }) => {
                      const active = form.recurrence === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onChange({ recurrence: id })}
                          aria-pressed={active}
                          className={cn(
                            'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition',
                            active
                              ? 'border-primary bg-primary-muted/50 text-primary'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300',
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{t(`${p}.recurrences.${id}`)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.recurrence !== 'CUSTOM_SCHEDULE' ? (
                  <MoneyInput
                    label={t(`${p}.amount_per.${form.recurrence}`)}
                    value={form.amount}
                    onChange={(v) => onChange({ amount: v })}
                    error={err('amount')}
                    large
                  />
                ) : null}

                {form.recurrence === 'MONTHLY' ? (
                  <div>
                    <FieldLabel>{t(`${p}.due_day_of_month`)}</FieldLabel>
                    <div className="mt-1.5 grid grid-cols-7 gap-1.5 tablet:grid-cols-[repeat(16,minmax(0,1fr))]">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => onChange({ dueDayOfMonth: d })}
                          aria-pressed={form.dueDayOfMonth === d}
                          className={cn(
                            'h-9 rounded-lg text-xs font-semibold tabular-nums transition',
                            form.dueDayOfMonth === d
                              ? 'bg-primary text-white shadow-sm shadow-primary/30'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100',
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    {form.dueDayOfMonth > 28 ? (
                      <Hint>{t(`${p}.month_clamp_hint`, { day: form.dueDayOfMonth })}</Hint>
                    ) : null}
                  </div>
                ) : null}

                {form.recurrence === 'WEEKLY' ? (
                  <div>
                    <FieldLabel>{t(`${p}.due_day_of_week`)}</FieldLabel>
                    <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                      {WEEK_ORDER.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => onChange({ dueDayOfWeek: d })}
                          aria-pressed={form.dueDayOfWeek === d}
                          className={cn(
                            'h-10 rounded-lg text-xs font-semibold transition',
                            form.dueDayOfWeek === d
                              ? 'bg-primary text-white shadow-sm shadow-primary/30'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100',
                          )}
                        >
                          {t(`${p}.weekdays_short.${d}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {form.recurrence === 'DAILY' ? (
                  <div>
                    <FieldLabel>{t(`${p}.daily_basis`)}</FieldLabel>
                    <div className="mt-1.5">
                      <Segmented
                        value={form.dailyBasis}
                        onChange={(v) => onChange({ dailyBasis: v })}
                        options={[
                          { value: 'WORKING_DAYS', label: t(`${p}.daily.WORKING_DAYS`) },
                          { value: 'CALENDAR_DAYS', label: t(`${p}.daily.CALENDAR_DAYS`) },
                        ]}
                      />
                    </div>
                    <Hint>{t(`${p}.daily_hint.${form.dailyBasis}`)}</Hint>
                  </div>
                ) : null}

                {form.recurrence === 'INTERVAL' ? (
                  <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
                    <div>
                      <FieldLabel>{t(`${p}.interval_every`)}</FieldLabel>
                      <input
                        inputMode="numeric"
                        aria-label={t(`${p}.interval_every`)}
                        value={form.intervalValue}
                        onChange={(e) =>
                          onChange({ intervalValue: e.target.value.replace(/\D/g, '').slice(0, 3) })
                        }
                        className={cn(
                          'mt-1.5 h-12 w-full rounded-xl border bg-slate-50/80 px-3.5 text-base font-semibold tabular-nums text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20',
                          errors.intervalValue ? 'border-red-300' : 'border-slate-200',
                        )}
                      />
                    </div>
                    <div>
                      <FieldLabel>{t(`${p}.interval_unit`)}</FieldLabel>
                      <div className="mt-1.5">
                        <Segmented
                          value={form.intervalUnit}
                          onChange={(v) => onChange({ intervalUnit: v })}
                          options={[
                            { value: 'DAY', label: t(`${p}.units.DAY`) },
                            { value: 'WEEK', label: t(`${p}.units.WEEK`) },
                            { value: 'MONTH', label: t(`${p}.units.MONTH`) },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <FieldError>{err('intervalValue')}</FieldError>
                      <Hint>{t(`${p}.interval_hint`)}</Hint>
                    </div>
                  </div>
                ) : null}

                {form.recurrence === 'ONE_TIME' ? (
                  <DatePicker
                    label={t(`${p}.one_time_due`)}
                    value={form.oneTimeDueDate}
                    min={form.effectiveFrom}
                    onChange={(iso) => onChange({ oneTimeDueDate: iso })}
                    error={err('oneTimeDueDate')}
                  />
                ) : null}

                {form.recurrence === 'CUSTOM_SCHEDULE' ? (
                  <ScheduleItems form={form} onChange={onChange} error={err('scheduleItems')} />
                ) : null}

                <button
                  type="button"
                  onClick={() => setAdvanced((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
                >
                  <ChevronDown
                    className={cn('h-4 w-4 transition', advanced ? 'rotate-180' : '')}
                  />
                  {t(`${p}.advanced`)}
                </button>
                {advanced || errors.graceDays ? (
                  <div className="space-y-3 rounded-2xl bg-slate-50/70 p-3.5">
                    <div className="grid gap-3 tablet:grid-cols-[140px_minmax(0,1fr)]">
                      <div>
                        <FieldLabel>{t(`${p}.grace_days`)}</FieldLabel>
                        <input
                          inputMode="numeric"
                          aria-label={t(`${p}.grace_days`)}
                          value={form.graceDays}
                          onChange={(e) =>
                            onChange({ graceDays: e.target.value.replace(/\D/g, '').slice(0, 2) })
                          }
                          className={cn(
                            'mt-1.5 h-11 w-full rounded-xl border bg-white px-3.5 text-sm font-semibold tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                            errors.graceDays ? 'border-red-300' : 'border-slate-200',
                          )}
                        />
                      </div>
                      <p className="self-end pb-2 text-xs leading-relaxed text-slate-500">
                        {t(`${p}.grace_hint`)}
                      </p>
                    </div>
                    <FieldError>{err('graceDays')}</FieldError>
                    {form.recurrence === 'MONTHLY' || form.recurrence === 'WEEKLY' ? (
                      <Toggle
                        checked={form.prorateFirstPeriod}
                        onChange={(v) => onChange({ prorateFirstPeriod: v })}
                        label={t(`${p}.prorate`)}
                        description={t(`${p}.prorate_hint`)}
                      />
                    ) : null}
                  </div>
                ) : null}

                <PreviewCard
                  items={preview}
                  title={t(`${p}.preview_title`)}
                  empty={t(`${p}.preview_empty`)}
                  proratedLabel={t(`${p}.prorated`)}
                  money={money}
                  date={date}
                />
              </div>
            </ModalSection>
          ) : null}

          {showBalances && rent ? (
            <ModalSection title={t(`${p}.prior_question`)}>
              <div className="grid gap-2 tablet:grid-cols-3">
                {PRIOR_OPTIONS.map(({ id, icon: Icon }) => {
                  const active = form.prior === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onChange({ prior: id })}
                      aria-pressed={active}
                      className={cn(
                        'flex items-start gap-2.5 rounded-xl border p-3 text-left transition',
                        active
                          ? 'border-primary bg-primary-muted/40 ring-2 ring-primary/15'
                          : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      <Icon
                        className={cn('mt-0.5 h-4 w-4 shrink-0', active ? 'text-primary' : 'text-slate-400')}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">
                          {t(`${p}.prior.${id}.title`)}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                          {t(`${p}.prior.${id}.hint`)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {form.prior === 'paid' ? (
                <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 p-4">
                  <div className="grid gap-3 tablet:grid-cols-2">
                    <MoneyInput
                      label={t(`${p}.prior.paid.amount`)}
                      value={form.priorAmount}
                      onChange={(v) => onChange({ priorAmount: v })}
                      error={err('priorAmount')}
                    />
                    <DatePicker
                      label={t(`${p}.prior.paid.paid_at`)}
                      value={form.priorPaidAt}
                      max={today}
                      onChange={(iso) => onChange({ priorPaidAt: iso })}
                      error={err('priorPaidAt')}
                    />
                    <DatePicker
                      label={t(`${p}.prior.paid.covered_from`)}
                      value={form.priorCoveredFrom}
                      onChange={(iso) => onChange({ priorCoveredFrom: iso })}
                    />
                    <DatePicker
                      label={t(`${p}.prior.paid.covered_to`)}
                      value={form.priorCoveredTo}
                      min={form.priorCoveredFrom || undefined}
                      onChange={(iso) => onChange({ priorCoveredTo: iso })}
                      error={err('priorCovered')}
                    />
                  </div>
                  <MethodPicker
                    value={form.priorMethod}
                    onChange={(m) => onChange({ priorMethod: m })}
                  />
                  {form.priorCoveredTo && addDays(form.priorCoveredTo, 1) !== form.effectiveFrom ? (
                    <div className="flex flex-col gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200 tablet:flex-row tablet:items-center">
                      <Info className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1">
                        {t(`${p}.prior.paid.align_hint`, {
                          date: date(addDays(form.priorCoveredTo, 1)),
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => onChange({ effectiveFrom: addDays(form.priorCoveredTo, 1) })}
                        className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                      >
                        {t(`${p}.prior.paid.align_action`)}
                      </button>
                    </div>
                  ) : (
                    <Hint>{t(`${p}.prior.paid.history_hint`)}</Hint>
                  )}
                </div>
              ) : null}

              {form.prior === 'debt' ? (
                <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 p-4">
                  <MoneyInput
                    label={t(`${p}.prior.debt.amount`)}
                    value={form.debtAmount}
                    onChange={(v) => onChange({ debtAmount: v })}
                    error={err('debtAmount')}
                    hint={t(`${p}.prior.debt.amount_hint`)}
                  />
                  <TextArea
                    label={t(`${p}.prior.debt.note`)}
                    value={form.debtNote}
                    onChange={(v) => onChange({ debtNote: v })}
                    placeholder={t(`${p}.prior.debt.note_placeholder`)}
                  />
                </div>
              ) : null}
            </ModalSection>
          ) : null}

          <TextArea
            label={t(`${p}.notes`)}
            value={form.notes}
            onChange={(v) => onChange({ notes: v })}
            placeholder={t(`${p}.notes_placeholder`)}
            maxLength={2000}
          />
        </>
      ) : null}
    </div>
  );
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-sky-50/80 p-3 text-xs leading-relaxed text-slate-700 ring-1 ring-sky-100">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
      <span>{children}</span>
    </div>
  );
}

function ScheduleItems({
  form,
  onChange,
  error,
}: {
  form: Form;
  onChange: (patch: Partial<Form>) => void;
  error?: string;
}) {
  const { t } = useCrmI18n();
  const p = 'crm.doctor_finance';
  const items = form.scheduleItems;
  const update = (i: number, patch: Partial<Form['scheduleItems'][number]>) =>
    onChange({ scheduleItems: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  return (
    <div className="space-y-2">
      <FieldLabel>{t(`${p}.schedule_items`)}</FieldLabel>
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px] items-end gap-2">
          <DatePicker
            label={i === 0 ? t(`${p}.schedule_date`) : ''}
            value={it.dueDate}
            min={form.effectiveFrom}
            onChange={(iso) => update(i, { dueDate: iso })}
          />
          <MoneyInput
            label={i === 0 ? t(`${p}.schedule_amount`) : ''}
            value={it.amount}
            onChange={(v) => update(i, { amount: v })}
          />
          <button
            type="button"
            disabled={items.length === 1}
            onClick={() => onChange({ scheduleItems: items.filter((_, j) => j !== i) })}
            aria-label={t(`${p}.remove`)}
            className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={items.length >= 120}
        onClick={() => {
          const last = items[items.length - 1];
          onChange({
            scheduleItems: [
              ...items,
              { dueDate: last?.dueDate ? addDays(last.dueDate, 30) : form.effectiveFrom, amount: last?.amount ?? '' },
            ],
          });
        }}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-muted"
      >
        <Plus className="h-4 w-4" />
        {t(`${p}.schedule_add`)}
      </button>
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function MethodPicker({
  value,
  onChange,
}: {
  value: 'cash' | 'card' | 'transfer' | 'other';
  onChange: (v: 'cash' | 'card' | 'transfer' | 'other') => void;
}) {
  const { t } = useCrmI18n();
  return (
    <div className="space-y-1.5">
      <FieldLabel>{t('crm.doctor_finance.method')}</FieldLabel>
      <Segmented
        value={value}
        onChange={onChange}
        label={t('crm.doctor_finance.method')}
        options={[
          { value: 'cash', label: t('crm.doctor_finance.methods.cash'), icon: Banknote },
          { value: 'card', label: t('crm.doctor_finance.methods.card'), icon: CreditCard },
          { value: 'transfer', label: t('crm.doctor_finance.methods.transfer'), icon: ArrowLeftRight },
          { value: 'other', label: t('crm.doctor_finance.methods.other') },
        ]}
      />
    </div>
  );
}

function PreviewCard({
  items,
  title,
  empty,
  proratedLabel,
  money,
  date,
}: {
  items: { dueDate: string; amountUzs: number; prorated: boolean; periodStart: string; periodEnd: string }[];
  title: string;
  empty: string;
  proratedLabel: string;
  money: (n: number) => string;
  date: (iso: string) => string;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary-muted/70 via-white to-white p-4 ring-1 ring-primary/15">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-primary">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{empty}</p>
      ) : (
        <ol className="mt-2.5 space-y-1.5">
          {items.map((o, i) => (
            <li key={`${o.dueDate}-${i}`} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  i === 0 ? 'bg-primary text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200',
                )}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-slate-900">{date(o.dueDate)}</span>
                {o.periodStart !== o.periodEnd ? (
                  <span className="ml-1.5 text-xs text-slate-400">
                    ({date(o.periodStart)} – {date(o.periodEnd)})
                  </span>
                ) : null}
              </span>
              {o.prorated ? (
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  {proratedLabel}
                </span>
              ) : null}
              <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                {money(o.amountUzs)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
