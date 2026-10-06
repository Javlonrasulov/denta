'use client';

import { CalendarCheck2, Copy, MoreHorizontal, RotateCcw } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { TimePicker, fromMinutes } from '@/components/ui/TimePicker';
import type { ClinicHoursIssue, ClinicWorkingDay } from '@/lib/api/clinic-api';
import { cn } from '@/lib/cn';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

/** Monday-first display order; values follow JS Date#getDay (0 = Sunday). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAYS_AFTER_MONDAY = [2, 3, 4, 5, 6];

export type ScheduleDay = {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  lunchEnabled: boolean;
  lunchStart: string;
  lunchEnd: string;
};

export type DayErrors = Partial<Record<number, { hours?: string; lunch?: string }>>;

type IssueCode = ClinicHoursIssue['code'];

const DEFAULT_LUNCH = { lunchStart: '13:00', lunchEnd: '14:00' };

function standardDay(dayOfWeek: number): ScheduleDay {
  return {
    dayOfWeek,
    isOpen: dayOfWeek !== 0,
    openTime: '09:00',
    closeTime: '18:00',
    lunchEnabled: dayOfWeek !== 0,
    ...DEFAULT_LUNCH,
  };
}

export function scheduleFromWorkingHours(
  saved: ClinicWorkingDay[] | null | undefined,
): ScheduleDay[] {
  const list = Array.isArray(saved) ? saved : null;
  return WEEK_ORDER.map((day) => {
    if (!list) return { ...standardDay(day), lunchEnabled: false };
    const found = list.find((h) => h.day === day);
    if (!found) {
      return { ...standardDay(day), isOpen: false, lunchEnabled: false };
    }
    return {
      dayOfWeek: day,
      isOpen: !found.closed,
      openTime: found.open,
      closeTime: found.close,
      lunchEnabled: Boolean(found.lunchEnabled && found.lunchStart && found.lunchEnd),
      lunchStart: found.lunchStart ?? DEFAULT_LUNCH.lunchStart,
      lunchEnd: found.lunchEnd ?? DEFAULT_LUNCH.lunchEnd,
    };
  });
}

export function scheduleToWorkingHours(days: ScheduleDay[]): ClinicWorkingDay[] {
  return days.map((d) => ({
    day: d.dayOfWeek,
    open: d.openTime,
    close: d.closeTime,
    closed: !d.isOpen,
    lunchEnabled: d.isOpen && d.lunchEnabled,
    ...(d.isOpen && d.lunchEnabled ? { lunchStart: d.lunchStart, lunchEnd: d.lunchEnd } : {}),
  }));
}

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Mirrors server rules in `apps/api/src/slots/clinic-hours.ts`. */
export function scheduleIssues(days: ScheduleDay[]): ClinicHoursIssue[] {
  const issues: ClinicHoursIssue[] = [];
  for (const d of days) {
    if (!d.isOpen) continue;
    const open = minutes(d.openTime);
    const close = minutes(d.closeTime);
    if (open >= close) {
      issues.push({ day: d.dayOfWeek, field: 'hours', code: 'HOURS_ORDER' });
      continue;
    }
    if (!d.lunchEnabled) continue;
    const ls = minutes(d.lunchStart);
    const le = minutes(d.lunchEnd);
    if (ls >= le) {
      issues.push({ day: d.dayOfWeek, field: 'lunch', code: 'LUNCH_ORDER' });
    } else if (ls < open || le > close || (ls === open && le === close)) {
      issues.push({ day: d.dayOfWeek, field: 'lunch', code: 'LUNCH_OUTSIDE_HOURS' });
    }
  }
  return issues;
}

const ISSUE_KEYS: Record<IssueCode, string> = {
  INVALID_TIME: 'crm.settings.schedule.err_invalid',
  HOURS_ORDER: 'crm.settings.schedule.err_hours_order',
  LUNCH_ORDER: 'crm.settings.schedule.err_lunch_order',
  LUNCH_OUTSIDE_HOURS: 'crm.settings.schedule.err_lunch_outside',
  DUPLICATE_DAY: 'crm.settings.schedule.err_invalid',
};

export function issuesToDayErrors(
  issues: ClinicHoursIssue[],
  t: (key: string) => string,
): DayErrors {
  const out: DayErrors = {};
  for (const issue of issues) {
    const field = issue.field === 'lunch' ? 'lunch' : 'hours';
    out[issue.day] = { ...out[issue.day], [field]: t(ISSUE_KEYS[issue.code]) };
  }
  return out;
}

function sameShape(a: ScheduleDay, b: ScheduleDay): boolean {
  return (
    a.openTime === b.openTime &&
    a.closeTime === b.closeTime &&
    a.lunchEnabled === b.lunchEnabled &&
    (!a.lunchEnabled || (a.lunchStart === b.lunchStart && a.lunchEnd === b.lunchEnd))
  );
}

function copyShape(from: ScheduleDay, to: ScheduleDay): ScheduleDay {
  return {
    ...to,
    isOpen: from.isOpen,
    openTime: from.openTime,
    closeTime: from.closeTime,
    lunchEnabled: from.lunchEnabled,
    lunchStart: from.lunchStart,
    lunchEnd: from.lunchEnd,
  };
}

export function WeeklySchedule({
  value,
  onChange,
  disabled,
  errors,
}: {
  value: ScheduleDay[];
  onChange: (next: ScheduleDay[]) => void;
  disabled?: boolean;
  errors: DayErrors;
}) {
  const { t } = useCrmI18n();
  const dayName = (d: number) => t(`crm.settings.day_${d}`);

  const summary = useMemo(() => {
    const open = value.filter((d) => d.isOpen);
    if (!open.length) return { allClosed: true as const };
    const uniform = open.every((d) => sameShape(d, open[0]));
    const positions = open.map((d) => WEEK_ORDER.indexOf(d.dayOfWeek));
    const contiguous = positions.every((p, i) => i === 0 || p === positions[i - 1] + 1);
    const daysLabel =
      open.length === 1
        ? dayName(open[0].dayOfWeek)
        : contiguous
          ? `${dayName(open[0].dayOfWeek)}–${dayName(open[open.length - 1].dayOfWeek)}`
          : open.map((d) => t(`crm.settings.schedule.short_${d.dayOfWeek}`)).join(', ');
    return {
      allClosed: false as const,
      count: open.length,
      uniform,
      daysLabel,
      hours: `${open[0].openTime}–${open[0].closeTime}`,
      lunch: open[0].lunchEnabled ? `${open[0].lunchStart}–${open[0].lunchEnd}` : null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, t]);

  function patchDay(day: number, patch: Partial<ScheduleDay>) {
    onChange(value.map((d) => (d.dayOfWeek === day ? { ...d, ...patch } : d)));
  }

  function copyTo(from: number, targets: number[]) {
    const source = value.find((d) => d.dayOfWeek === from);
    if (!source) return;
    onChange(value.map((d) => (targets.includes(d.dayOfWeek) ? copyShape(source, d) : d)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
          {summary.allClosed ? (
            <SummaryChip tone="muted">{t('crm.settings.schedule.all_closed')}</SummaryChip>
          ) : (
            <>
              <SummaryChip tone="primary" icon={<CalendarCheck2 className="h-3.5 w-3.5" />}>
                {t('crm.settings.schedule.work_week', { count: summary.count })}
              </SummaryChip>
              {summary.uniform ? (
                <>
                  <SummaryChip>
                    {summary.daysLabel} · <span className="tabular-nums">{summary.hours}</span>
                  </SummaryChip>
                  <SummaryChip tone={summary.lunch ? 'default' : 'muted'}>
                    {summary.lunch ? (
                      <>
                        {t('crm.settings.schedule.lunch')} ·{' '}
                        <span className="tabular-nums">{summary.lunch}</span>
                      </>
                    ) : (
                      t('crm.settings.schedule.lunch_off')
                    )}
                  </SummaryChip>
                </>
              ) : (
                <SummaryChip tone="amber">{t('crm.settings.schedule.individual')}</SummaryChip>
              )}
            </>
          )}
        </div>
        {!disabled ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange(WEEK_ORDER.map(standardDay))}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <RotateCcw className="h-4 w-4" />
              {t('crm.settings.schedule.preset_standard')}
            </button>
            <button
              type="button"
              onClick={() => copyTo(1, WEEKDAYS_AFTER_MONDAY)}
              title={t('crm.settings.schedule.apply_weekdays_hint')}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-primary/40 hover:text-primary"
            >
              <Copy className="h-4 w-4" />
              {t('crm.settings.schedule.apply_weekdays')}
            </button>
          </div>
        ) : null}
      </div>

      <div role="table" aria-label={t('crm.settings.section_hours')} className="text-sm">
        <div
          role="row"
          className="hidden items-center gap-4 border-b border-slate-100 pb-2 text-table-head uppercase text-slate-400 lg:flex"
        >
          <span role="columnheader" className="w-[132px] shrink-0">
            {t('crm.settings.schedule.col_day')}
          </span>
          <span role="columnheader" className="w-[156px] shrink-0">
            {t('crm.settings.schedule.col_status')}
          </span>
          <span role="columnheader" className="min-w-0 flex-1">
            {t('crm.settings.schedule.col_hours')}
          </span>
          <span role="columnheader" className="min-w-0 flex-[1.3]">
            {t('crm.settings.schedule.col_lunch')}
          </span>
          <span role="columnheader" className="w-9 shrink-0">
            <span className="sr-only">{t('crm.settings.schedule.col_actions')}</span>
          </span>
        </div>

        {value.map((d) => (
          <DayRow
            key={d.dayOfWeek}
            day={d}
            name={dayName(d.dayOfWeek)}
            disabled={disabled}
            error={errors[d.dayOfWeek]}
            onPatch={(patch) => patchDay(d.dayOfWeek, patch)}
            onCopy={(targets) => copyTo(d.dayOfWeek, targets)}
          />
        ))}
      </div>
    </div>
  );
}

function SummaryChip({
  children,
  tone = 'default',
  icon,
}: {
  children: React.ReactNode;
  tone?: 'default' | 'primary' | 'muted' | 'amber';
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium',
        tone === 'primary' && 'bg-primary-muted text-primary',
        tone === 'default' && 'bg-slate-100 text-slate-700',
        tone === 'muted' && 'bg-slate-50 text-slate-400',
        tone === 'amber' && 'bg-amber-50 text-amber-700',
      )}
    >
      {icon}
      {children}
    </span>
  );
}

function DayRow({
  day,
  name,
  disabled,
  error,
  onPatch,
  onCopy,
}: {
  day: ScheduleDay;
  name: string;
  disabled?: boolean;
  error?: { hours?: string; lunch?: string };
  onPatch: (patch: Partial<ScheduleDay>) => void;
  onCopy: (targets: number[]) => void;
}) {
  const { t } = useCrmI18n();
  const message = error?.hours ?? error?.lunch;

  return (
    <div
      role="row"
      data-day={day.dayOfWeek}
      className={cn(
        'border-b border-slate-100 py-3 last:border-b-0',
        !day.isOpen && 'bg-slate-50/50',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 lg:min-h-[44px] lg:flex-nowrap">
        <span
          role="cell"
          className={cn(
            'order-1 min-w-0 flex-1 font-semibold lg:w-[132px] lg:flex-none',
            day.isOpen ? 'text-slate-900' : 'text-slate-400',
          )}
        >
          {name}
        </span>

        <div role="cell" className="order-2 flex items-center gap-2.5 lg:w-[156px] lg:shrink-0">
          <Switch
            checked={day.isOpen}
            disabled={disabled}
            label={`${name}: ${t('crm.settings.schedule.col_status')}`}
            onChange={(isOpen) => onPatch({ isOpen })}
          />
          <span
            className={cn('text-sm', day.isOpen ? 'font-medium text-emerald-700' : 'text-slate-500')}
          >
            {day.isOpen ? t('crm.settings.schedule.open') : t('crm.settings.schedule.day_off')}
          </span>
        </div>

        <div role="cell" className="order-3 w-9 shrink-0 lg:order-5 lg:ml-auto">
          {!disabled ? (
            <CopyMenu dayName={name} from={day.dayOfWeek} onApply={onCopy} />
          ) : null}
        </div>

        <span aria-hidden className="order-3 h-0 basis-full lg:hidden" />

        {day.isOpen ? (
          <>
            <div
              role="cell"
              className="order-4 flex min-w-0 basis-full items-center gap-3 tablet:basis-auto lg:order-3 lg:flex-1"
            >
              <span className="mr-auto text-caption text-slate-500 tablet:mr-0 lg:hidden">
                {t('crm.settings.schedule.col_hours')}
              </span>
              <TimeRange
                start={day.openTime}
                end={day.closeTime}
                disabled={disabled}
                invalid={Boolean(error?.hours)}
                startLabel={`${name}: ${t('crm.settings.schedule.open_time')}`}
                endLabel={`${name}: ${t('crm.settings.schedule.close_time')}`}
                onChange={(openTime, closeTime) => onPatch({ openTime, closeTime })}
              />
            </div>
            <div
              role="cell"
              className="order-5 flex min-w-0 basis-full items-center gap-2.5 tablet:basis-auto tablet:pl-3 lg:order-4 lg:flex-[1.3] lg:pl-0"
            >
              <Switch
                size="sm"
                checked={day.lunchEnabled}
                disabled={disabled}
                label={`${name}: ${t('crm.settings.schedule.col_lunch')}`}
                onChange={(lunchEnabled) =>
                  onPatch(
                    lunchEnabled && !day.lunchEnabled
                      ? { lunchEnabled, ...defaultLunchWithin(day) }
                      : { lunchEnabled },
                  )
                }
              />
              <span className="mr-auto text-caption text-slate-500 tablet:mr-0 lg:hidden">
                {t('crm.settings.schedule.lunch')}
              </span>
              {day.lunchEnabled ? (
                <TimeRange
                  start={day.lunchStart}
                  end={day.lunchEnd}
                  bounds={{ min: day.openTime, max: day.closeTime }}
                  disabled={disabled}
                  invalid={Boolean(error?.lunch)}
                  startLabel={`${name}: ${t('crm.settings.schedule.lunch_start')}`}
                  endLabel={`${name}: ${t('crm.settings.schedule.lunch_end')}`}
                  onChange={(lunchStart, lunchEnd) => onPatch({ lunchStart, lunchEnd })}
                />
              ) : (
                <span className="text-sm text-slate-400">{t('crm.settings.schedule.lunch_off')}</span>
              )}
            </div>
          </>
        ) : null}
      </div>
      {day.isOpen && message ? (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600 lg:pl-[304px]">
          {message}
        </p>
      ) : null}
    </div>
  );
}

/** Keeps the stored lunch if it still fits, otherwise centers 13:00–14:00 inside the day. */
function defaultLunchWithin(day: ScheduleDay): Pick<ScheduleDay, 'lunchStart' | 'lunchEnd'> {
  const open = minutes(day.openTime);
  const close = minutes(day.closeTime);
  const fits = (s: string, e: string) => minutes(s) >= open && minutes(e) <= close;
  if (fits(day.lunchStart, day.lunchEnd)) {
    return { lunchStart: day.lunchStart, lunchEnd: day.lunchEnd };
  }
  if (fits(DEFAULT_LUNCH.lunchStart, DEFAULT_LUNCH.lunchEnd)) return DEFAULT_LUNCH;
  return { lunchStart: day.lunchStart, lunchEnd: day.lunchEnd };
}

function Switch({
  checked,
  onChange,
  disabled,
  label,
  size = 'md',
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
  size?: 'md' | 'sm';
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        size === 'md' ? 'h-6 w-11' : 'h-5 w-9',
        checked ? 'bg-primary' : 'bg-slate-200',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-block rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition-transform duration-200',
          size === 'md' ? 'h-5 w-5' : 'h-4 w-4',
          checked
            ? size === 'md'
              ? 'translate-x-[22px]'
              : 'translate-x-[18px]'
            : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

const LAST_SLOT = '23:45';

/**
 * Start options stay before `max`; end options stay after `start` and within the bounds.
 * Moving the start past the end shifts the end, keeping the previous duration.
 */
function TimeRange({
  start,
  end,
  bounds,
  disabled,
  invalid,
  startLabel,
  endLabel,
  onChange,
}: {
  start: string;
  end: string;
  bounds?: { min: string; max: string };
  disabled?: boolean;
  invalid?: boolean;
  startLabel: string;
  endLabel: string;
  onChange: (start: string, end: string) => void;
}) {
  const min = minutes(bounds?.min ?? '00:00');
  const max = minutes(bounds?.max ?? LAST_SLOT);

  function changeStart(next: string) {
    const s = minutes(next);
    const e = minutes(end);
    if (e > s) return onChange(next, end);
    const duration = e > minutes(start) ? e - minutes(start) : 60;
    onChange(next, fromMinutes(Math.min(s + duration, max)));
  }

  return (
    <div className="flex items-center gap-1.5">
      <TimePicker
        value={start}
        onChange={changeStart}
        disabled={disabled}
        invalid={invalid}
        label={startLabel}
        isOptionDisabled={(time) => minutes(time) < min || minutes(time) >= max}
        className="w-[78px] tablet:w-[104px]"
      />
      <span aria-hidden className="text-slate-300">
        –
      </span>
      <TimePicker
        value={end}
        onChange={(next) => onChange(start, next)}
        disabled={disabled}
        invalid={invalid}
        label={endLabel}
        isOptionDisabled={(time) => minutes(time) <= minutes(start) || minutes(time) > max}
        className="w-[78px] tablet:w-[104px]"
      />
    </div>
  );
}

function CopyMenu({
  dayName,
  from,
  onApply,
}: {
  dayName: string;
  from: number;
  onApply: (targets: number[]) => void;
}) {
  const { t } = useCrmI18n();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const targets = WEEK_ORDER.filter((d) => d !== from);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={t('crm.settings.schedule.day_actions', { day: dayName })}
        onClick={() => {
          setSelected([]);
          setOpen((v) => !v);
        }}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700',
          open && 'bg-slate-100 text-slate-700',
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={t('crm.settings.schedule.copy_title', { day: dayName })}
          className="absolute right-0 top-full z-30 mt-1.5 w-[17.5rem] rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10"
        >
          <p className="text-sm font-semibold text-slate-900">
            {t('crm.settings.schedule.copy_title', { day: dayName })}
          </p>
          <p className="mt-0.5 text-caption text-slate-500">{t('crm.settings.schedule.copy_to')}</p>
          <div className="mt-3 grid grid-cols-6 gap-1.5">
            {targets.map((d) => {
              const on = selected.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  title={t(`crm.settings.day_${d}`)}
                  onClick={() =>
                    setSelected((prev) => (on ? prev.filter((x) => x !== d) : [...prev, d]))
                  }
                  className={cn(
                    'h-9 rounded-lg text-xs font-semibold transition',
                    on
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  {t(`crm.settings.schedule.short_${d}`)}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setSelected(targets.filter((d) => d !== 0))}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t('crm.settings.schedule.select_workdays')}
            </button>
            <button
              type="button"
              disabled={!selected.length}
              onClick={() => {
                onApply(selected);
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-white transition hover:bg-primary-pressed disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('crm.settings.schedule.copy_apply', { count: selected.length })}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
