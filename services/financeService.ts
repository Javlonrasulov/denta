import {
  MOCK_APPOINTMENTS,
  MOCK_DOCTORS,
  MOCK_FINANCE,
  MOCK_PATIENTS,
  MOCK_ROOMS,
} from '@/mocks/data';
import type { FinanceRecord } from '@/types';
import { mockNetworkDelay } from './apiClient';

export type FinanceFilter = 'today' | 'week' | 'month' | 'year';

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

export async function getFinanceRecords(
  filter?: FinanceFilter,
): Promise<FinanceRecord[]> {
  await mockNetworkDelay();
  return filterByPeriod([...MOCK_FINANCE], filter);
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

  const revenue = MOCK_FINANCE.filter((r) => r.type === 'income').reduce(
    (sum, r) => sum + r.amount,
    0,
  );

  return {
    revenue,
    appointments: MOCK_APPOINTMENTS.length,
    patients: MOCK_PATIENTS.filter((p) => p.status === 'active').length,
    doctors: MOCK_DOCTORS.length,
    availableRooms: MOCK_ROOMS.filter((r) => r.status === 'available').length,
    cancelled: MOCK_APPOINTMENTS.filter((a) => a.status === 'cancelled').length,
  };
}
