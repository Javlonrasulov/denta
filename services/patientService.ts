import { MOCK_PATIENTS } from '@/mocks/data';
import type { Patient } from '@/types';
import { mockNetworkDelay } from './apiClient';

export async function getPatients(query?: string): Promise<Patient[]> {
  await mockNetworkDelay();

  if (!query?.trim()) return [...MOCK_PATIENTS];

  const q = query.toLowerCase();
  return MOCK_PATIENTS.filter(
    (p) =>
      p.fullName.toLowerCase().includes(q) ||
      p.phone.includes(q),
  );
}

export async function getPatientById(id: string): Promise<Patient | null> {
  await mockNetworkDelay();
  return MOCK_PATIENTS.find((p) => p.id === id) ?? null;
}
