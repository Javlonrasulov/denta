'use client';

import { AlertTriangle, Coffee, CopyCheck, Plus, Smartphone, Timer, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TimePicker } from '@/components/ui/TimePicker';
import { cn } from '@/lib/cn';
import type { DoctorScheduleDay } from '@/lib/api/clinic-api';
import {
  MAX_SLOT,
  MIN_SLOT,
  PRESETS,
  SLOT_OPTIONS,
  WEEK_ORDER,
  capacity,
  findConflicts,
  slotTimes,
  toMinutes,
  scheduleFromWeek,
  validateWeek,
  weeklyMinutes,
  type DayState,
  type PresetKey,
  type WeekState,
} from '@/lib/doctor-schedule';

export function ScheduleEditor({
  week,
  onWeekChange,
  slotDuration,
  onSlotChange,
  busy = [],
}: {
  week: WeekState;
  onWeekChange: (next: WeekState) => void;
  slotDuration: number;
  onSlotChange: (next: number) => void;
  /** Hours the doctor already works in other clinics, used to warn about overlaps. */
  busy?: { clinicName: string; schedule: DoctorScheduleDay[] }[];
}) {
  const { t } = useTranslation();
  const dayLong = (d: number) => t(`crm.doctors.schedule.day_long.${d}`);

  const schedule = useMemo(() => scheduleFromWeek(week), [week]);
  const errors = useMemo(() => validateWeek(week), [week]);
  const conflicts = useMemo(() => findConflicts(schedule, busy), [schedule, busy]);
  const hours = Math.round((weeklyMinutes(schedule) / 60) * 10) / 10;

  const setDay = (d: number, patch: Partial<DayState>) =>
    onWeekChange({ ...week, [d]: { ...week[d], ...patch } });

  const copyToAll = (from: number) => {
    const src = week[from];
    const next: WeekState = { ...week };
    for (const d of WEEK_ORDER) {
      if (next[d].enabled) next[d] = { ...src, enabled: true };
    }
    onWeekChange(next);
  };

  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.04em] text-slate-400">
        {t('crm.doctors.schedule.title')}
      </h3>

      <VisitLength schedule={schedule} value={slotDuration} onChange={onSlotChange} />

      <p className="mb-2 mt-5 text-sm font-medium text-slate-700">{t('crm.doctors.schedule.days_title')}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onWeekChange(PRESETS[key]())}
            className="inline-flex h-8 items-center rounded-full bg-white px-3 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-primary-muted hover:text-primary hover:ring-primary/30 active:scale-95"
          >
            {t(`crm.doctors.schedule.presets.${key}`)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <ul className="divide-y divide-slate-100">
          {WEEK_ORDER.map((d) => {
            const day = week[d];
            const error = errors[d];
            return (
              <li
                key={d}
                className={cn(
                  'group flex flex-wrap items-center gap-x-2.5 gap-y-2 px-3 py-2.5 transition-colors',
                  day.enabled ? 'bg-white' : 'bg-slate-50/70',
                  error && 'bg-rose-50/50',
                )}
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={day.enabled}
                  aria-label={dayLong(d)}
                  onClick={() => setDay(d, { enabled: !day.enabled })}
                  className={cn(
                    'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                    day.enabled ? 'bg-primary' : 'bg-slate-300',
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0 top-0.5 h-4 w-4 rounded-full bg-frost shadow-sm transition-transform',
                      day.enabled ? 'translate-x-[18px]' : 'translate-x-0.5',
                    )}
                  />
                </button>
                <span
                  className={cn(
                    'w-[88px] shrink-0 text-sm font-medium',
                    day.enabled ? 'text-slate-800' : 'text-slate-400',
                  )}
                >
                  {dayLong(d)}
                </span>

                {day.enabled ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <TimePicker
                        label={`${dayLong(d)} · ${t('crm.doctors.schedule.from')}`}
                        value={day.start}
                        onChange={(v) => setDay(d, { start: v })}
                        invalid={error === 'range'}
                        isOptionDisabled={(v) => toMinutes(v) >= toMinutes(day.end)}
                        className="!h-9 w-[92px]"
                      />
                      <span className="text-slate-300">–</span>
                      <TimePicker
                        label={`${dayLong(d)} · ${t('crm.doctors.schedule.to')}`}
                        value={day.end}
                        onChange={(v) => setDay(d, { end: v })}
                        invalid={error === 'range'}
                        isOptionDisabled={(v) => toMinutes(v) <= toMinutes(day.start)}
                        className="!h-9 w-[92px]"
                      />
                    </div>

                    {day.lunch ? (
                      <div
                        className={cn(
                          'flex items-center gap-1 rounded-lg bg-amber-50 py-1 pl-2 pr-1 ring-1 ring-inset',
                          error === 'lunch' ? 'ring-rose-300' : 'ring-amber-200/70',
                        )}
                      >
                        <Coffee className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <TimePicker
                          label={`${dayLong(d)} · ${t('crm.doctors.schedule.lunch')} · ${t('crm.doctors.schedule.from')}`}
                          value={day.breakStart}
                          onChange={(v) => setDay(d, { breakStart: v })}
                          invalid={error === 'lunch'}
                          isOptionDisabled={(v) =>
                            toMinutes(v) < toMinutes(day.start) || toMinutes(v) >= toMinutes(day.end)
                          }
                          className="!h-8 w-[84px] !border-amber-200 !text-amber-900"
                        />
                        <span className="text-amber-300">–</span>
                        <TimePicker
                          label={`${dayLong(d)} · ${t('crm.doctors.schedule.lunch')} · ${t('crm.doctors.schedule.to')}`}
                          value={day.breakEnd}
                          onChange={(v) => setDay(d, { breakEnd: v })}
                          invalid={error === 'lunch'}
                          isOptionDisabled={(v) =>
                            toMinutes(v) <= toMinutes(day.breakStart) || toMinutes(v) > toMinutes(day.end)
                          }
                          className="!h-8 w-[84px] !border-amber-200 !text-amber-900"
                        />
                        <button
                          type="button"
                          onClick={() => setDay(d, { lunch: false })}
                          aria-label={t('crm.doctors.schedule.remove_lunch')}
                          title={t('crm.doctors.schedule.remove_lunch')}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-amber-500 transition hover:bg-amber-100 hover:text-amber-700"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDay(d, { lunch: true })}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2.5 text-xs font-medium text-slate-500 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t('crm.doctors.schedule.add_lunch')}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => copyToAll(d)}
                      title={t('crm.doctors.schedule.copy_all')}
                      aria-label={t('crm.doctors.schedule.copy_all')}
                      className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-primary ring-1 ring-inset ring-indigo-100 transition hover:bg-primary hover:text-white tablet:opacity-0 tablet:group-hover:opacity-100 tablet:focus:opacity-100"
                    >
                      <CopyCheck className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-medium text-slate-400">{t('crm.doctors.schedule.day_off')}</span>
                )}

                {error ? (
                  <p className="basis-full pl-12 text-xs font-medium text-rose-600">
                    {t(`crm.doctors.schedule.errors.${error}`)}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs">
          <span className="font-medium text-slate-600">
            {schedule.length
              ? t('crm.doctors.schedule.summary', { days: schedule.length, hours })
              : t('crm.doctors.schedule.errors.empty')}
          </span>
          <span className="text-slate-400">{t('crm.doctors.schedule.hint')}</span>
        </div>
      </div>

      {conflicts.length ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            {t('crm.doctors.schedule.conflict_title')}
          </p>
          <ul className="mt-1.5 space-y-1 pl-6 text-xs text-amber-800/90">
            {conflicts.map((c) => (
              <li key={`${c.dayOfWeek}-${c.clinicName}`} className="list-disc">
                {t('crm.doctors.schedule.conflict', {
                  day: dayLong(c.dayOfWeek),
                  clinic: c.clinicName,
                  time: `${c.start}–${c.end}`,
                })}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function VisitLength({
  schedule,
  value,
  onChange,
}: {
  schedule: DoctorScheduleDay[];
  value: number;
  onChange: (next: number) => void;
}) {
  const { t } = useTranslation();
  const isPreset = (SLOT_OPTIONS as readonly number[]).includes(value);
  const [custom, setCustom] = useState(isPreset ? '' : String(value));

  useEffect(() => {
    if ((SLOT_OPTIONS as readonly number[]).includes(value)) setCustom('');
    else setCustom(String(value));
  }, [value]);

  const cap = capacity(schedule, value);
  const preview = schedule.length ? slotTimes(schedule[0], value) : [];
  const customNum = Number.parseInt(custom, 10);
  const customInvalid = custom !== '' && (!Number.isFinite(customNum) || customNum < MIN_SLOT || customNum > MAX_SLOT);

  return (
    <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary-muted/70 via-white to-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
          <Timer className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{t('crm.doctors.schedule.per_patient')}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t('crm.doctors.schedule.per_patient_hint')}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {SLOT_OPTIONS.map((m) => {
          const active = value === m;
          return (
            <button
              key={m}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(m)}
              className={cn(
                'inline-flex h-9 min-w-[64px] items-center justify-center rounded-lg px-3 text-sm font-semibold tabular-nums ring-1 ring-inset transition active:scale-95',
                active
                  ? 'bg-primary text-white shadow-sm shadow-primary/30 ring-primary'
                  : 'bg-white text-slate-700 ring-slate-200 hover:text-primary hover:ring-primary/40',
              )}
            >
              {t('crm.doctors.schedule.minutes', { count: m })}
            </button>
          );
        })}
        <label
          className={cn(
            'inline-flex h-9 items-center gap-1 rounded-lg bg-white pl-3 pr-2 text-sm ring-1 ring-inset transition focus-within:ring-2',
            customInvalid
              ? 'ring-rose-300 focus-within:ring-rose-300'
              : !isPreset
                ? 'ring-primary focus-within:ring-primary/40'
                : 'ring-slate-200 focus-within:ring-primary/40',
          )}
        >
          <input
            inputMode="numeric"
            value={custom}
            placeholder={t('crm.doctors.schedule.custom')}
            onChange={(e) => {
              const next = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
              setCustom(next);
              const n = Number.parseInt(next, 10);
              if (Number.isFinite(n) && n >= MIN_SLOT && n <= MAX_SLOT) onChange(n);
            }}
            className="w-16 bg-transparent font-semibold tabular-nums text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
          />
          <span className="text-xs text-slate-400">{t('crm.doctors.schedule.min_unit')}</span>
        </label>
      </div>
      {customInvalid ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600">
          {t('crm.doctors.schedule.errors.slot', { min: MIN_SLOT, max: MAX_SLOT })}
        </p>
      ) : null}

      {schedule.length ? (
        <div className="mt-3 space-y-1.5 border-t border-primary/10 pt-3 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Users className="h-3.5 w-3.5 text-primary" />
            {cap.min === cap.max
              ? t('crm.doctors.schedule.capacity', { day: cap.max, week: cap.week })
              : t('crm.doctors.schedule.capacity_range', { min: cap.min, max: cap.max, week: cap.week })}
          </p>
          {preview.length ? (
            <p className="flex flex-wrap items-center gap-1 text-slate-500">
              <Smartphone className="h-3.5 w-3.5 text-slate-400" />
              {t('crm.doctors.schedule.preview')}
              {preview.slice(0, 5).map((time) => (
                <span
                  key={time}
                  className="rounded-md bg-white px-1.5 py-0.5 font-semibold tabular-nums text-slate-700 ring-1 ring-inset ring-slate-200"
                >
                  {time}
                </span>
              ))}
              {preview.length > 5 ? <span className="text-slate-400">…</span> : null}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
