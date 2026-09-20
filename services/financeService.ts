import type { FinanceRecord, PaymentMethod, PaymentStatus } from '@/types';
import { localDateKey } from '@/utils/doctorDashboard';
import {
  apiGet,
  apiPatch,
  apiPost,
  mockNetworkDelay,
  useMockApi,
} from './apiClient';
import { MOCK_FINANCE } from '@/mocks/data';

export type FinanceFilter = 'today' | 'week' | 'month' | 'year';

export type CreateFinanceInput = {
  type: 'income' | 'expense';
  amount: number;
  serviceName: string;
  date?: string;
  time?: string;
  patientName?: string;
  patientId?: string;
  doctorName?: string;
  doctorId?: string;
  appointmentId?: string;
  chargeId?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
};

let records: FinanceRecord[] = MOCK_FINANCE.map((row) => ({ ...row }));

export async function getFinanceRecords(
  filter?: FinanceFilter,
): Promise<FinanceRecord[]> {
  if (!useMockApi()) {
    return apiGet<FinanceRecord[]>('/finance', { period: filter ?? 'month' });
  }
  await mockNetworkDelay();
  return records.map((row) => ({ ...row }));
}

export async function createFinanceRecord(
  input: CreateFinanceInput,
): Promise<FinanceRecord> {
  if (!useMockApi()) {
    return apiPost<FinanceRecord>('/finance', {
      ...input,
      date: input.date ?? localDateKey(),
    });
  }
  await mockNetworkDelay();
  const created: FinanceRecord = {
    id: `fin-${Date.now()}`,
    date: input.date ?? localDateKey(),
    time: input.time,
    patientName: input.patientName,
    patientId: input.patientId,
    doctorName: input.doctorName,
    doctorId: input.doctorId,
    serviceName: input.serviceName.trim(),
    amount: input.amount,
    type: input.type,
    paymentStatus: input.paymentStatus ?? 'paid',
    paymentMethod: input.paymentMethod,
    notes: input.notes?.trim() || undefined,
  };
  records = [created, ...records];
  return { ...created };
}

export async function updateFinanceRecord(
  id: string,
  input: Partial<CreateFinanceInput> & { paymentStatus?: PaymentStatus },
): Promise<FinanceRecord> {
  if (!useMockApi()) {
    return apiPatch<FinanceRecord>(`/finance/${id}`, input);
  }
  await mockNetworkDelay();
  const index = records.findIndex((r) => r.id === id);
  if (index === -1) throw new Error(`Finance record not found: ${id}`);
  const updated = { ...records[index], ...input } as FinanceRecord;
  records = [...records.slice(0, index), updated, ...records.slice(index + 1)];
  return { ...updated };
}

export async function getDoctorTodayStats(): Promise<{
  patients: number;
  completed: number;
  upcoming: number;
  income: number;
}> {
  if (!useMockApi()) {
    const dash = await apiGet<{
      patientsToday?: number;
      completedAppointments?: number;
      remainingAppointments?: number;
      todayRevenue?: number;
    }>('/doctors/me/dashboard');
    return {
      patients: dash.patientsToday ?? 0,
      completed: dash.completedAppointments ?? 0,
      upcoming: dash.remainingAppointments ?? 0,
      income: dash.todayRevenue ?? 0,
    };
  }
  await mockNetworkDelay();
  return { patients: 0, completed: 0, upcoming: 0, income: 0 };
}

export async function getClinicDashboardStats(): Promise<{
  revenue: number;
  appointments: number;
  patients: number;
  doctors: number;
  availableRooms: number;
  cancelled: number;
}> {
  if (!useMockApi()) {
    return apiGet('/analytics/dashboard');
  }
  await mockNetworkDelay();
  return {
    revenue: 0,
    appointments: 0,
    patients: 0,
    doctors: 0,
    availableRooms: 0,
    cancelled: 0,
  };
}
