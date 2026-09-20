'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { PatientFlowChart } from '@/components/analytics/PatientFlowChart';
import { PatientFlowInsights } from '@/components/analytics/PatientFlowInsights';
import { PatientFlowSkeleton } from '@/components/analytics/PatientFlowSkeleton';
import { cn } from '@/lib/cn';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';
import {
  fetchPatientFlow,
  type PatientFlowPeriod,
  type PatientFlowSeries,
} from '@/lib/patient-flow';

const PERIODS: PatientFlowPeriod[] = ['7d', '30d', '3m', '12m'];

function pointLabel(t: (key: string, opts?: Record<string, unknown>) => string, key: string) {
  const day = t(`crm.patient_flow.days.${key}`);
  if (day !== `crm.patient_flow.days.${key}`) return day;

  const month = t(`crm.patient_flow.months.${key}`);
  if (month !== `crm.patient_flow.months.${key}`) return month;

  const week = t(`crm.patient_flow.weeks.${key}`);
  if (week !== `crm.patient_flow.weeks.${key}`) return week;

  if (key.startsWith('d')) {
    const n = key.slice(1);
    return t('crm.patient_flow.day_n', { n });
  }

  return key;
}

export function PatientFlowCard() {
  const { t, number } = useCrmI18n();
  const [period, setPeriod] = useState<PatientFlowPeriod>('7d');
  const [series, setSeries] = useState<PatientFlowSeries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchPatientFlow(period).then((data) => {
      if (cancelled) return;
      setSeries(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const chartData = useMemo(() => {
    if (!series) return [];
    return series.points.map((p) => ({
      key: p.key,
      label: pointLabel(t, p.key),
      total: p.total,
      new: p.new,
      returning: p.returning,
    }));
  }, [series, t]);

  const empty = !loading && (!series || series.points.length === 0);
  const positive = (series?.changePercent ?? 0) >= 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-4 laptop:flex-row laptop:items-start laptop:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-section-title text-slate-900">
                {t('crm.patient_flow.title')}
              </h2>
              {series && !loading ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold ring-1 ring-inset',
                    positive
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
                      : 'bg-rose-50 text-rose-700 ring-rose-600/15',
                  )}
                >
                  {positive ? (
                    <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.4} />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.4} />
                  )}
                  {positive ? '+' : ''}
                  {series.changePercent.toFixed(1)}%
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm font-normal text-slate-500">
              {t('crm.patient_flow.subtitle')}
            </p>
          </div>

          <div
            role="tablist"
            aria-label={t('crm.patient_flow.period_label')}
            className="inline-flex flex-wrap gap-1 rounded-full bg-slate-100/90 p-1 ring-1 ring-inset ring-slate-200/80"
          >
            {PERIODS.map((p) => {
              const active = period === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-caption font-semibold tracking-normal transition',
                    active
                      ? 'bg-white text-indigo-700 shadow-sm shadow-slate-900/5 ring-1 ring-slate-200/80'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {t(`crm.patient_flow.periods.${p}`)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <PatientFlowSkeleton />
        ) : empty ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl bg-slate-50/80 px-6 text-center ring-1 ring-inset ring-slate-200/70">
            <p className="text-sm font-semibold text-slate-800">
              {t('crm.patient_flow.empty_title')}
            </p>
            <p className="mt-1.5 max-w-md text-sm text-slate-500">
              {t('crm.patient_flow.empty_subtitle')}
            </p>
          </div>
        ) : series ? (
          <div className="space-y-5">
            <PatientFlowInsights
              items={[
                {
                  label: t('crm.patient_flow.total'),
                  value: number(series.total),
                },
                {
                  label: t('crm.patient_flow.average'),
                  value: number(series.averagePerDay),
                },
                {
                  label: t('crm.patient_flow.best_day'),
                  value: pointLabel(t, series.bestDayKey),
                },
                {
                  label: t('crm.patient_flow.growth'),
                  value: `${positive ? '+' : ''}${series.changePercent.toFixed(1)}%`,
                },
              ]}
            />

            <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-indigo-50/40 via-white to-white px-1 pt-1 ring-1 ring-inset ring-indigo-100/60">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-200/20 blur-3xl" />
              <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-indigo-200/20 blur-3xl" />
              <PatientFlowChart
                data={chartData}
                labels={{
                  patients: t('crm.patient_flow.patients_unit'),
                  newPatients: t('crm.patient_flow.new_patients'),
                  returning: t('crm.patient_flow.returning_patients'),
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-caption text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                {t('crm.patient_flow.legend_total')}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-500/80" />
                {t('crm.patient_flow.new_patients')}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                {t('crm.patient_flow.returning_patients')}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
