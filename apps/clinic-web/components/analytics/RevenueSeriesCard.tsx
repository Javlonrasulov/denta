'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { cn } from '@/lib/cn';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';
import {
  fetchRevenueSeries,
  type RevenuePeriod,
  type RevenueSeries,
} from '@/lib/revenue-series';

const PERIODS: RevenuePeriod[] = ['7d', '30d', '12m'];

function shortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function RevenueSeriesCard() {
  const { t, money } = useCrmI18n();
  const [period, setPeriod] = useState<RevenuePeriod>('7d');
  const [series, setSeries] = useState<RevenueSeries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSeries(null);
    void fetchRevenueSeries(period)
      .then((data) => {
        if (cancelled) return;
        setSeries(data);
      })
      .catch(() => {
        if (cancelled) return;
        setSeries(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const chartData = useMemo(() => {
    if (!series) return [];
    return series.points.map((p) => ({
      date: p.date,
      label: shortDate(p.date),
      revenue: p.revenue,
    }));
  }, [series]);

  const empty = !loading && (!series || series.points.length === 0);
  const positive = (series?.changePercent ?? 0) >= 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-4 laptop:flex-row laptop:items-start laptop:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-section-title text-slate-900">
                {t('crm.reports.revenue_summary')}
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
              {t('crm.reports.revenue_summary_hint')}
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
                  {t(`crm.patient_flow.periods.${p}`, {
                    defaultValue: p,
                  })}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-400">
            …
          </div>
        ) : empty ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl bg-slate-50/80 px-6 text-center ring-1 ring-inset ring-slate-200/70">
            <p className="text-sm font-semibold text-slate-800">
              {t('crm.patient_flow.empty_title')}
            </p>
            <p className="mt-1.5 max-w-md text-sm text-slate-500">
              {t('crm.reports.revenue_summary_hint')}
            </p>
          </div>
        ) : series ? (
          <div className="space-y-4">
            <p className="text-kpi text-slate-900">{money(series.total)}</p>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D9488" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#0D9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value) => [
                      money(Number(value ?? 0)),
                      t('crm.dashboard.revenue'),
                    ]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0D9488"
                    strokeWidth={2}
                    fill="url(#revenueArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
