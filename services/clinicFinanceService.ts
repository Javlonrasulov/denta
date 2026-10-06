import { ApiError, apiGet, useMockApi } from '@/services/apiClient';

export type ClinicFinanceModel =
  | 'CLINIC_REVENUE'
  | 'DOCTOR_REVENUE_PLUS_RENT'
  | 'REVENUE_SHARE'
  | 'CUSTOM';

export type ClinicFinanceObligation = {
  id: string;
  kind: 'RENT' | 'OPENING_BALANCE';
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  amountUzs: number;
  paidUzs: number;
  outstandingUzs: number;
  status: 'UPCOMING' | 'DUE' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  daysOverdue: number;
};

export type ClinicFinancePayment = {
  id: string;
  kind: 'PAYMENT' | 'PRIOR';
  status: 'CONFIRMED' | 'SUBMITTED' | 'REJECTED' | 'VOIDED';
  amountUzs: number;
  paidDate: string;
  voidedAt: string | null;
};

export type ClinicFinance = {
  clinic: { id: string; name: string };
  today: string;
  configured: boolean;
  agreement: {
    version: number;
    model: ClinicFinanceModel;
    effectiveFrom: string;
    clinicPercent: number;
    rent: { amountUzs: number | null } | null;
  } | null;
  summary: {
    totalDebtUzs: number;
    overdueUzs: number;
    advanceUzs: number;
    nextDue: { date: string; amountUzs: number } | null;
    pendingSubmissions: number;
  };
  obligations: ClinicFinanceObligation[];
  payments: ClinicFinancePayment[];
};

/**
 * Read-only settlement of the signed-in doctor with the active clinic.
 * Resolves to null when there is no clinic context or the doctor is not linked to it.
 */
export async function getMyClinicFinance(): Promise<ClinicFinance | null> {
  if (useMockApi()) return null;
  try {
    return await apiGet<ClinicFinance>('/doctors/me/clinic-finance');
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) return null;
    throw error;
  }
}
