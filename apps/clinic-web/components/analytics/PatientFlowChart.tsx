'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { PatientFlowTooltip } from '@/components/analytics/PatientFlowTooltip';

export type ChartRow = {
  key: string;
  label: string;
  total: number;
  new: number;
  returning: number;
};

export function PatientFlowChart({
  data,
  labels,
}: {
  data: ChartRow[];
  labels: {
    patients: string;
    newPatients: string;
    returning: string;
  };
}) {
  const gradientId = 'patientFlowArea';

  return (
    <div className="h-[240px] w-full sm:h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.28} />
              <stop offset="55%" stopColor="#22D3EE" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
            </linearGradient>
            <filter id="patientFlowGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid
            strokeDasharray="3 8"
            vertical={false}
            stroke="#E2E8F0"
            strokeOpacity={0.85}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 500 }}
            interval="preserveStartEnd"
            minTickGap={18}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={6}
            width={36}
            tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 500 }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{
              stroke: '#A5B4FC',
              strokeWidth: 1,
              strokeDasharray: '4 4',
            }}
            content={<PatientFlowTooltip labels={labels} />}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#4F46E5"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            activeDot={{
              r: 5,
              strokeWidth: 2,
              stroke: '#fff',
              fill: '#4F46E5',
              filter: 'url(#patientFlowGlow)',
            }}
            dot={false}
            isAnimationActive
            animationDuration={650}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
