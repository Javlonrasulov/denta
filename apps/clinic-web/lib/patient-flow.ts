export type PatientFlowPeriod = '7d' | '30d' | '3m' | '12m';

export type PatientFlowPoint = {
  /** Stable key for i18n day/month labels, e.g. mon | week_1 | jan */
  key: string;
  /** Optional ISO date for future backend mapping */
  date?: string;
  total: number;
  new: number;
  returning: number;
};

export type PatientFlowSeries = {
  period: PatientFlowPeriod;
  total: number;
  averagePerDay: number;
  changePercent: number;
  /** Point key of the peak day/bucket */
  bestDayKey: string;
  points: PatientFlowPoint[];
};

const WEEK: PatientFlowPoint[] = [
  { key: 'mon', date: '2026-03-16', total: 12, new: 4, returning: 8 },
  { key: 'tue', date: '2026-03-17', total: 18, new: 6, returning: 12 },
  { key: 'wed', date: '2026-03-18', total: 10, new: 3, returning: 7 },
  { key: 'thu', date: '2026-03-19', total: 21, new: 7, returning: 14 },
  { key: 'fri', date: '2026-03-20', total: 16, new: 5, returning: 11 },
  { key: 'sat', date: '2026-03-21', total: 8, new: 2, returning: 6 },
  { key: 'sun', date: '2026-03-22', total: 5, new: 1, returning: 4 },
];

const MONTH: PatientFlowPoint[] = [
  { key: 'd1', total: 9, new: 3, returning: 6 },
  { key: 'd5', total: 14, new: 5, returning: 9 },
  { key: 'd9', total: 11, new: 4, returning: 7 },
  { key: 'd13', total: 19, new: 7, returning: 12 },
  { key: 'd17', total: 22, new: 8, returning: 14 },
  { key: 'd21', total: 15, new: 5, returning: 10 },
  { key: 'd25', total: 17, new: 6, returning: 11 },
  { key: 'd29', total: 13, new: 4, returning: 9 },
];

const QUARTER: PatientFlowPoint[] = [
  { key: 'w1', total: 78, new: 24, returning: 54 },
  { key: 'w2', total: 92, new: 31, returning: 61 },
  { key: 'w3', total: 84, new: 27, returning: 57 },
  { key: 'w4', total: 101, new: 35, returning: 66 },
  { key: 'w5', total: 88, new: 28, returning: 60 },
  { key: 'w6', total: 96, new: 30, returning: 66 },
  { key: 'w7', total: 110, new: 38, returning: 72 },
  { key: 'w8', total: 94, new: 29, returning: 65 },
  { key: 'w9', total: 102, new: 33, returning: 69 },
  { key: 'w10', total: 87, new: 26, returning: 61 },
  { key: 'w11', total: 99, new: 32, returning: 67 },
  { key: 'w12', total: 115, new: 40, returning: 75 },
];

const YEAR: PatientFlowPoint[] = [
  { key: 'jan', total: 310, new: 98, returning: 212 },
  { key: 'feb', total: 286, new: 90, returning: 196 },
  { key: 'mar', total: 342, new: 112, returning: 230 },
  { key: 'apr', total: 355, new: 118, returning: 237 },
  { key: 'may', total: 368, new: 121, returning: 247 },
  { key: 'jun', total: 331, new: 105, returning: 226 },
  { key: 'jul', total: 298, new: 94, returning: 204 },
  { key: 'aug', total: 275, new: 86, returning: 189 },
  { key: 'sep', total: 360, new: 120, returning: 240 },
  { key: 'oct', total: 382, new: 128, returning: 254 },
  { key: 'nov', total: 370, new: 122, returning: 248 },
  { key: 'dec', total: 348, new: 110, returning: 238 },
];

const SERIES: Record<PatientFlowPeriod, { changePercent: number; points: PatientFlowPoint[] }> = {
  '7d': { changePercent: 12.4, points: WEEK },
  '30d': { changePercent: 8.1, points: MONTH },
  '3m': { changePercent: 15.6, points: QUARTER },
  '12m': { changePercent: -3.2, points: YEAR },
};

function summarize(
  period: PatientFlowPeriod,
  points: PatientFlowPoint[],
  changePercent: number,
): PatientFlowSeries {
  const total = points.reduce((sum, p) => sum + p.total, 0);
  const best = points.reduce((a, b) => (b.total > a.total ? b : a), points[0]);
  return {
    period,
    total,
    averagePerDay: Math.round(total / Math.max(points.length, 1)),
    changePercent,
    bestDayKey: best?.key ?? '',
    points,
  };
}

/**
 * Backend-ready patient flow loader.
 * Replace the body with an API call when the endpoint exists.
 */
export async function fetchPatientFlow(
  period: PatientFlowPeriod,
): Promise<PatientFlowSeries> {
  const pack = SERIES[period];
  // Simulate network latency for loading/skeleton UX
  await new Promise((r) => setTimeout(r, 320));
  return summarize(period, pack.points, pack.changePercent);
}

export function getPatientFlowSync(period: PatientFlowPeriod): PatientFlowSeries {
  const pack = SERIES[period];
  return summarize(period, pack.points, pack.changePercent);
}
