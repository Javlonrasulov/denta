import type {
  Patient,
  PatientClinicalStatus,
  PatientPayment,
  PatientTreatment,
} from '@/types';
import { localDateKey } from '@/utils/doctorDashboard';

export type PatientFilter =
  | 'all'
  | 'today'
  | 'treatment'
  | 'debt'
  | 'new'
  | 'follow_up';

export type PatientSort = 'last_visit' | 'next' | 'az' | 'newest' | 'debt';

export type PatientSummaryStats = {
  total: number;
  today: number;
  treatment: number;
  debt: number;
};

const LOCALE_MAP: Record<string, string> = {
  uz: 'uz-Latn-UZ',
  'uz-Cyrl': 'uz-Cyrl-UZ',
  ru: 'ru-RU',
  en: 'en-GB',
};

export function splitPatientName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

export function patientFullName(patient: Pick<Patient, 'fullName' | 'firstName' | 'lastName'>): string {
  if (patient.fullName?.trim()) return patient.fullName.trim();
  return [patient.firstName, patient.lastName].filter(Boolean).join(' ').trim();
}

export function patientDisplayId(patient: Patient): string {
  if (patient.displayId) return patient.displayId;
  const digits = patient.id.replace(/\D/g, '') || '0';
  return `DNT-${String(10240 + Number(digits)).padStart(5, '0')}`;
}

export function patientClinicalStatus(patient: Patient): PatientClinicalStatus {
  if (patient.clinicalStatus) return patient.clinicalStatus;
  if ((patient.balance ?? 0) > 0) return 'debt';
  if (patient.status === 'inactive') return 'completed';
  if (!patient.lastVisit) return 'new';
  if (patient.nextAppointment) return 'treatment';
  return 'follow_up';
}

export function patientHasDebt(patient: Patient): boolean {
  return (patient.balance ?? 0) > 0 || patientClinicalStatus(patient) === 'debt';
}

export function isPatientToday(patient: Patient, today = localDateKey()): boolean {
  return patient.nextAppointment === today;
}

export function formatPatientPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) {
    return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }
  if (digits.length === 9) {
    return `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  }
  return phone;
}

export function formatPatientDate(iso?: string | null, locale = 'uz'): string {
  if (!iso) return '';
  const intlLocale = LOCALE_MAP[locale] ?? 'uz-Latn-UZ';
  try {
    const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    const parts = new Intl.DateTimeFormat(intlLocale, {
      day: 'numeric',
      month: 'short',
    }).formatToParts(date);
    const day = parts.find((p) => p.type === 'day')?.value ?? '';
    const month = parts.find((p) => p.type === 'month')?.value ?? '';
    const cap = month ? month.charAt(0).toUpperCase() + month.slice(1).replace('.', '') : '';
    return `${day} ${cap}`.trim();
  } catch {
    return iso;
  }
}

export function formatNextAppointment(
  patient: Patient,
  locale = 'uz',
): { date: string; time?: string } | null {
  if (!patient.nextAppointment) return null;
  return {
    date: formatPatientDate(patient.nextAppointment, locale),
    time: patient.nextAppointmentTime,
  };
}

export function normalizeSearch(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '').replace(/[+()-]/g, '');
}

export function matchesPatientQuery(patient: Patient, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const compact = normalizeSearch(q);
  const haystacks = [
    patientFullName(patient),
    patient.firstName ?? '',
    patient.lastName ?? '',
    patient.phone,
    patient.id,
    patient.displayId ?? '',
    patientDisplayId(patient),
  ];
  return haystacks.some((value) => normalizeSearch(value).includes(compact));
}

export function filterPatients(
  patients: Patient[],
  filter: PatientFilter,
  today = localDateKey(),
): Patient[] {
  switch (filter) {
    case 'today':
      return patients.filter((p) => isPatientToday(p, today));
    case 'treatment':
      return patients.filter((p) => patientClinicalStatus(p) === 'treatment');
    case 'debt':
      return patients.filter(patientHasDebt);
    case 'new':
      return patients.filter((p) => patientClinicalStatus(p) === 'new');
    case 'follow_up':
      return patients.filter((p) => patientClinicalStatus(p) === 'follow_up');
    default:
      return patients;
  }
}

function timeValue(iso?: string, time?: string): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const stamp = new Date(`${iso}T${time ?? '00:00'}:00`).getTime();
  return Number.isNaN(stamp) ? Number.POSITIVE_INFINITY : stamp;
}

export function sortPatients(patients: Patient[], sort: PatientSort): Patient[] {
  const copy = [...patients];
  copy.sort((a, b) => {
    switch (sort) {
      case 'last_visit':
        return timeValue(b.lastVisit) - timeValue(a.lastVisit);
      case 'next':
        return timeValue(a.nextAppointment, a.nextAppointmentTime) -
          timeValue(b.nextAppointment, b.nextAppointmentTime);
      case 'az':
        return patientFullName(a).localeCompare(patientFullName(b), 'uz');
      case 'newest':
        return timeValue(b.createdAt ?? b.lastVisit) - timeValue(a.createdAt ?? a.lastVisit);
      case 'debt':
        return (b.balance ?? 0) - (a.balance ?? 0);
      default:
        return 0;
    }
  });
  return copy;
}

export function summarizePatients(
  patients: Patient[],
  today = localDateKey(),
): PatientSummaryStats {
  return {
    total: patients.length,
    today: patients.filter((p) => isPatientToday(p, today)).length,
    treatment: patients.filter((p) => patientClinicalStatus(p) === 'treatment').length,
    debt: patients.filter(patientHasDebt).length,
  };
}

export function queryPatients(
  patients: Patient[],
  query: string,
  filter: PatientFilter,
  sort: PatientSort,
): Patient[] {
  const matched = patients.filter((p) => matchesPatientQuery(p, query));
  return sortPatients(filterPatients(matched, filter), sort);
}

export function patientPayments(patient: Patient): PatientPayment[] {
  return [...(patient.payments ?? [])].sort((a, b) => b.date.localeCompare(a.date));
}

export function patientTreatments(patient: Patient): PatientTreatment[] {
  return [...(patient.treatments ?? [])].sort((a, b) => b.date.localeCompare(a.date));
}

export function problemTeeth(patient: Patient): number[] {
  return [...(patient.problemTeeth ?? [])].sort((a, b) => a - b);
}
