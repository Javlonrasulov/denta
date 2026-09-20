import type { CreatePatientInput, Patient, ToothRecord } from '@/types';
import { matchesPatientQuery } from '@/utils/doctorPatients';
import { localDateKey } from '@/utils/doctorDashboard';
import {
  apiGet,
  apiPatch,
  apiPost,
  mockNetworkDelay,
  useMockApi,
} from './apiClient';
import { MOCK_PATIENTS } from '@/mocks/data';

let patients: Patient[] = MOCK_PATIENTS.map((p) => ({
  ...p,
  treatments: p.treatments ? p.treatments.map((tx) => ({ ...tx })) : undefined,
  payments: p.payments ? p.payments.map((pay) => ({ ...pay })) : undefined,
  problemTeeth: p.problemTeeth ? [...p.problemTeeth] : undefined,
}));

function nextDisplayId(): string {
  const nums = patients.map((p) => {
    const n = Number((p.displayId ?? '').replace(/\D/g, ''));
    return Number.isFinite(n) ? n : 0;
  });
  return `DNT-${Math.max(10240, ...nums) + 1}`;
}

export async function getPatients(query?: string): Promise<Patient[]> {
  if (!useMockApi()) {
    return apiGet<Patient[]>('/patients', { q: query });
  }
  await mockNetworkDelay();
  const all = patients.map((p) => ({ ...p }));
  if (!query?.trim()) return all;
  return all.filter((p) => matchesPatientQuery(p, query));
}

export async function getPatientById(id: string): Promise<Patient | null> {
  if (!useMockApi()) {
    try {
      return await apiGet<Patient>(`/patients/${id}`);
    } catch {
      return null;
    }
  }
  await mockNetworkDelay();
  const found = patients.find((p) => p.id === id);
  return found ? { ...found } : null;
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  if (!useMockApi()) {
    return apiPost<Patient>('/patients', input);
  }
  await mockNetworkDelay();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const created: Patient = {
    id: `patient-${Date.now()}`,
    displayId: nextDisplayId(),
    firstName,
    lastName,
    fullName,
    phone: input.phone.trim(),
    gender: input.gender,
    birthDate: input.birthDate.trim(),
    notes: input.notes?.trim() || undefined,
    status: 'active',
    clinicalStatus: 'new',
    balance: 0,
    visitCount: 0,
    createdAt: localDateKey(),
    treatments: [],
    payments: [],
  };
  patients = [created, ...patients];
  return { ...created };
}

export async function addPatientNote(id: string, note: string): Promise<Patient> {
  if (!useMockApi()) {
    return apiPatch<Patient>(`/patients/${id}/notes`, { notes: note });
  }
  await mockNetworkDelay();
  const index = patients.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`Patient not found: ${id}`);
  }
  const trimmed = note.trim();
  const current = patients[index];
  const nextNotes = current.notes ? `${current.notes}\n${trimmed}` : trimmed;
  const updated: Patient = { ...current, notes: nextNotes };
  patients = [...patients.slice(0, index), updated, ...patients.slice(index + 1)];
  return { ...updated };
}

export async function getPatientOdontogram(id: string): Promise<ToothRecord[]> {
  if (!useMockApi()) {
    const res = await apiGet<{ teeth: ToothRecord[] }>(`/patients/${id}/odontogram`);
    return res.teeth ?? [];
  }
  await mockNetworkDelay();
  return [];
}
