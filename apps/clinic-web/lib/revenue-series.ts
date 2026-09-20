import { clinicApi, clinicApiEnabled } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';

export type RevenuePeriod = '7d' | '30d' | '12m';

export type RevenuePoint = {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export type RevenueSeries = {
  period: string;
  total: number;
  changePercent: number;
  points: RevenuePoint[];
};

/** Map UI period to API period (API also accepts 3m). */
export function toApiRevenuePeriod(period: RevenuePeriod): string {
  return period;
}

export async function fetchRevenueSeries(
  period: RevenuePeriod,
): Promise<RevenueSeries> {
  if (!clinicApiEnabled()) {
    throw new Error('Configure NEXT_PUBLIC_API_URL');
  }
  const token = readPersistedSession()?.accessToken;
  if (!token) {
    throw new Error('No session');
  }
  return clinicApi.revenueSeries(token, toApiRevenuePeriod(period));
}
