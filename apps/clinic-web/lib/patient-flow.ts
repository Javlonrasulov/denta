import { clinicApi, clinicApiEnabled } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';

export type PatientFlowPeriod = '7d' | '30d' | '3m' | '12m';

export type PatientFlowPoint = {
  key: string;
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
  bestDayKey: string;
  points: PatientFlowPoint[];
};

export async function fetchPatientFlow(
  period: PatientFlowPeriod,
): Promise<PatientFlowSeries> {
  if (!clinicApiEnabled()) {
    throw new Error('Configure NEXT_PUBLIC_API_URL');
  }
  const token = readPersistedSession()?.accessToken;
  if (!token) {
    throw new Error('No session');
  }
  return (await clinicApi.patientFlow(token, period)) as PatientFlowSeries;
}
