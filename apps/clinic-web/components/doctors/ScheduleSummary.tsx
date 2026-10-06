'use client';

import { Coffee, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import type { DoctorScheduleDay } from '@/lib/api/clinic-api';
import { formatGroupDays, groupSchedule } from '@/lib/doctor-schedule';

export function useScheduleText() {
  const { t } = useTranslation();
  const short = (d: number) => t(`crm.doctors.schedule.day_short.${d}`);
  return (schedule: DoctorScheduleDay[]) =>
    groupSchedule(schedule).map((g) => `${formatGroupDays(g.days, short)} ${g.start}–${g.end}`);
}

/** Lunch shared by every working day, or null when days differ / have none. */
function commonLunch(schedule: DoctorScheduleDay[]): string | null {
  const first = schedule[0];
  if (!first?.breakStart || !first.breakEnd) return null;
  const same = schedule.every((s) => s.breakStart === first.breakStart && s.breakEnd === first.breakEnd);
  return same ? `${first.breakStart}–${first.breakEnd}` : null;
}

export function ScheduleSummary({
  schedule,
  slotDuration,
  tone = 'neutral',
  className,
}: {
  schedule: DoctorScheduleDay[];
  /** Minutes per patient; shown as an extra chip when given. */
  slotDuration?: number;
  tone?: 'neutral' | 'success';
  className?: string;
}) {
  const { t } = useTranslation();
  const lines = useScheduleText()(schedule);
  if (!lines.length) {
    return <span className="text-xs text-slate-400">{t('crm.doctors.schedule.none')}</span>;
  }
  const lunch = commonLunch(schedule);
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {lines.map((line) => (
        <span
          key={line}
          className={cn(
            'inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-inset',
            tone === 'success'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
              : 'bg-slate-50 text-slate-700 ring-slate-200',
          )}
        >
          {line}
        </span>
      ))}
      {lunch ? (
        <span
          title={t('crm.doctors.schedule.lunch')}
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-amber-700 ring-1 ring-inset ring-amber-200/70"
        >
          <Coffee className="h-3 w-3" />
          {lunch}
        </span>
      ) : null}
      {slotDuration ? (
        <span
          title={t('crm.doctors.schedule.per_patient')}
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-primary-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary ring-1 ring-inset ring-primary/15"
        >
          <Timer className="h-3 w-3" />
          {t('crm.doctors.schedule.per_patient_short', { count: slotDuration })}
        </span>
      ) : null}
    </div>
  );
}
