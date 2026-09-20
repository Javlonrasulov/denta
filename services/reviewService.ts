import type { Review } from '@/types';
import { apiGet, apiPost, mockNetworkDelay, useMockApi } from './apiClient';

export async function getClinicReviews(clinicId: string): Promise<Review[]> {
  if (!useMockApi()) {
    return apiGet<Review[]>(`/reviews/clinics/${clinicId}`, undefined, false);
  }
  await mockNetworkDelay();
  return [];
}

export async function getDoctorReviews(doctorId: string): Promise<Review[]> {
  if (!useMockApi()) {
    return apiGet<Review[]>(`/reviews/doctors/${doctorId}`, undefined, false);
  }
  await mockNetworkDelay();
  return [];
}

export async function createReview(input: {
  clinicId?: string;
  doctorId?: string;
  appointmentId?: string;
  rating: number;
  comment?: string;
}): Promise<Review> {
  if (!useMockApi()) {
    return apiPost<Review>('/reviews', input);
  }
  await mockNetworkDelay();
  return {
    id: `review-${Date.now()}`,
    authorName: 'You',
    rating: input.rating,
    comment: input.comment ?? '',
    date: new Date().toISOString().slice(0, 10),
    clinicId: input.clinicId,
    doctorId: input.doctorId,
  };
}
