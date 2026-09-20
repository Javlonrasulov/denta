import {
  MOCK_APPOINTMENTS,
  MOCK_DOCTORS,
  MOCK_FINANCE,
  MOCK_PATIENTS,
  MOCK_ROOMS,
} from '@/mocks/data';
import type { FinanceRecord, PaymentMethod, PaymentStatus } from '@/types';
import { DEMO_DOCTOR_ID, localDateKey } from '@/utils/doctorDashboard';
import { mockNetworkDelay } from './apiClient';

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
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseRecordDate(dateStr: string): Date {
  return startOfDay(new Date(dateStr + 'T00:00:00'));
}

function filterByPeriod(
  records: FinanceRecord[],
  filter?: FinanceFilter,
): FinanceRecord[] {
  if (!filter) return records;

  const today = startOfDay(new Date());
  const from = new Date(today);

  switch (filter) {
    case 'today':
      break;
    case 'week':
      from.setDate(from.getDate() - 6);
      break;
    case 'month':
      from.setMonth(from.getMonth() - 1);
      break;
    case 'year':
      from.setFullYear(from.getFullYear() - 1);
      break;
  }

  return records.filter((r) => {
    const d = parseRecordDate(r.date);
    return d >= from && d <= today;
  });
}

/** Module-level store so doctor create/update flows persist until refresh. */
let records: FinanceRecord[] = MOCK_FINANCE.map((row) => ({ ...row }));

export async function getFinanceRecords(
  filter?: FinanceFilter,
): Promise<FinanceRecord[]> {
  await mockNetworkDelay();
  return filterByPeriod(records.map((row) => ({ ...row })), filter);
}

export async function createFinanceRecord(
  input: CreateFinanceInput,
): Promise<FinanceRecord> {
  await mockNetworkDelay();
  const created: FinanceRecord = {
    id: `fin-${Date.now()}`,
    date: input.date ?? localDateKey(),
    time: input.time,
    patientName: input.patientName,
    patientId: input.patientId,
    doctorName: input.doctorName,
    doctorId: input.doctorId ?? DEMO_DOCTOR_ID,
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
  patch: Partial<CreateFinanceInput> & { paymentStatus?: PaymentStatus },
): Promise<FinanceRecord> {
  await mockNetworkDelay();
  const index = records.findIndex((row) => row.id === id);
  if (index === -1) {
    throw new Error(`Finance record not found: ${id}`);
  }
  const current = records[index];
  const updated: FinanceRecord = {
    ...current,
    ...patch,
    serviceName: patch.serviceName?.trim() || current.serviceName,
    notes: patch.notes === undefined ? current.notes : patch.notes.trim() || undefined,
  };
  records = [...records.slice(0, index), updated, ...records.slice(index + 1)];
  return { ...updated };
}

export async function getDoctorTodayStats(): Promise<{
  patients: number;
  completed: number;
  upcoming: number;
  income: number;
}> {
  await mockNetworkDelay();

  const todayStr = startOfDay(new Date()).toISOString().slice(0, 10);
  // Mock: stats for the primary demo doctor
  const doctorId = 'doctor-1';
  const todayAppts = MOCK_APPOINTMENTS.filter(
    (a) => a.doctorId === doctorId && a.date === todayStr,
  );

  const completed = todayAppts.filter((a) => a.status === 'completed').length;
  const upcoming = todayAppts.filter((a) => a.status === 'upcoming').length;
  const patients = new Set(
    todayAppts
      .filter((a) => a.status !== 'cancelled')
      .map((a) => a.patientId),
  ).size;
  const income = todayAppts
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, a) => sum + a.price, 0);

  return { patients, completed, upcoming, income };
}

export async function getClinicDashboardStats(): Promise<{
  revenue: number;
  appointments: number;
  patients: number;
  doctors: number;
  availableRooms: number;
  cancelled: number;
}> {
  await mockNetworkDelay();

  const revenue = records
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  return {
    revenue,
    appointments: MOCK_APPOINTMENTS.length,
    patients: MOCK_PATIENTS.filter((p) => p.status === 'active').length,
    doctors: MOCK_DOCTORS.length,
    availableRooms: MOCK_ROOMS.filter((r) => r.status === 'available').length,
    cancelled: MOCK_APPOINTMENTS.filter((a) => a.status === 'cancelled').length,
  };
}
