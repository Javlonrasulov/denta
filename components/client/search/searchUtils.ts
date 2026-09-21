import type { Clinic, Doctor } from '@/types';

import {
  DEFAULT_SEARCH_FILTERS,
  type DistanceBand,
  type ExperienceBand,
  type PriceBand,
  type SearchFilters,
  type SpecKey,
} from './types';

const SPEC_ALIASES: Record<string, SpecKey> = {
  therapy: 'therapy',
  therapist: 'therapy',
  terapevt: 'therapy',
  terapevtik: 'therapy',
  'terapevt stomatolog': 'therapy',
  orthodontics: 'orthodontics',
  orthodontist: 'orthodontics',
  ortodont: 'orthodontics',
  ortodontiya: 'orthodontics',
  implantology: 'implantology',
  implantolog: 'implantology',
  implantologiya: 'implantology',
  surgery: 'surgery',
  surgeon: 'surgery',
  jarroh: 'surgery',
  jarrohlik: 'surgery',
  pediatric: 'pediatric',
  pediatrics: 'pediatric',
  bolalar: 'pediatric',
  hygiene: 'hygiene',
  gigiyena: 'hygiene',
  aesthetic: 'aesthetic',
  estetik: 'aesthetic',
  prosthodontics: 'prosthodontics',
  prosthodontist: 'prosthodontics',
  ortopediya: 'prosthodontics',
  whitening: 'whitening',
  oqartirish: 'whitening',
};

export function specKeyFromLabel(value?: string | null): SpecKey | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  return SPEC_ALIASES[key] ?? null;
}

export function specLabel(t: (key: string) => string, value: string): string {
  const mapped = specKeyFromLabel(value);
  if (mapped) return t(`search.specs.${mapped}`);
  return value;
}

export function doctorSpecLabel(t: (key: string) => string, value: string): string {
  const mapped = specKeyFromLabel(value);
  if (mapped) return t(`search.doctor_specs.${mapped}`);
  return value;
}

export function clinicDistrict(address: string): string {
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2] ?? parts[0];
  return address;
}

function matchesPrice(priceFrom: number, band: PriceBand): boolean {
  if (band === 'any') return true;
  if (band === 'lt150') return priceFrom < 150_000;
  if (band === '150to300') return priceFrom >= 150_000 && priceFrom <= 300_000;
  return priceFrom > 300_000;
}

function matchesDistance(km: number | undefined, band: DistanceBand): boolean {
  if (band === 'any') return true;
  if (km == null) return true;
  return km <= Number(band);
}

function matchesExperience(years: number, band: ExperienceBand): boolean {
  if (band === 'any') return true;
  return years >= Number(band);
}

function recScore(rating: number, reviews: number, distanceKm?: number): number {
  return rating * 24 + Math.min(reviews, 400) / 16 - (distanceKm ?? 8);
}

export function filterClinics(list: Clinic[], query: string, filters: SearchFilters): Clinic[] {
  const q = query.trim().toLowerCase();
  const specFromQuery = specKeyFromLabel(q);
  const spec = filters.specialization;
  let next = list.filter((clinic) => {
    if (q) {
      const hay = `${clinic.name} ${clinic.address} ${clinic.specializations.join(' ')}`.toLowerCase();
      const specHit = specFromQuery
        ? clinic.specializations.some((s) => specKeyFromLabel(s) === specFromQuery)
        : false;
      if (!hay.includes(q) && !specHit) return false;
    }
    if (spec && !clinic.specializations.some((s) => specKeyFromLabel(s) === spec || s.toLowerCase().includes(spec))) {
      return false;
    }
    if (filters.minRating && clinic.rating < filters.minRating) return false;
    if (!matchesPrice(clinic.priceFrom, filters.priceBand)) return false;
    if (!matchesDistance(clinic.distanceKm, filters.distanceBand)) return false;
    if (filters.openNow && !clinic.isOpenNow) return false;
    return true;
  });

  next = [...next];
  switch (filters.sort) {
    case 'rating':
      next.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    case 'price':
      next.sort((a, b) => a.priceFrom - b.priceFrom);
      break;
    case 'nearest':
      next.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
      break;
    case 'popular':
      next.sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating);
      break;
    default:
      next.sort(
        (a, b) => recScore(b.rating, b.reviewCount, b.distanceKm) - recScore(a.rating, a.reviewCount, a.distanceKm),
      );
  }
  return next;
}

export function filterDoctors(
  list: Doctor[],
  clinicsById: Map<string, Clinic>,
  query: string,
  filters: SearchFilters,
): Doctor[] {
  const q = query.trim().toLowerCase();
  const specFromQuery = specKeyFromLabel(q);
  const spec = filters.specialization;
  let next = list.filter((doctor) => {
    const clinic = clinicsById.get(doctor.clinicId);
    if (q) {
      const hay = `${doctor.fullName} ${doctor.specialization} ${clinic?.name ?? ''}`.toLowerCase();
      const specHit = specFromQuery ? specKeyFromLabel(doctor.specialization) === specFromQuery : false;
      if (!hay.includes(q) && !specHit) return false;
    }
    if (
      spec &&
      specKeyFromLabel(doctor.specialization) !== spec &&
      !doctor.specialization.toLowerCase().includes(spec)
    ) {
      return false;
    }
    if (filters.minRating && doctor.rating < filters.minRating) return false;
    if (!matchesPrice(doctor.priceFrom, filters.priceBand)) return false;
    if (!matchesExperience(doctor.experienceYears, filters.experienceBand)) return false;
    if (filters.gender !== 'any' && doctor.gender !== filters.gender) return false;
    if (filters.openNow && clinic && !clinic.isOpenNow) return false;
    if (!matchesDistance(clinic?.distanceKm, filters.distanceBand)) return false;
    return true;
  });

  next = [...next];
  switch (filters.sort) {
    case 'rating':
      next.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    case 'price':
      next.sort((a, b) => a.priceFrom - b.priceFrom);
      break;
    case 'nearest':
      next.sort((a, b) => {
        const da = clinicsById.get(a.clinicId)?.distanceKm ?? 99;
        const db = clinicsById.get(b.clinicId)?.distanceKm ?? 99;
        return da - db;
      });
      break;
    case 'popular':
      next.sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating);
      break;
    default:
      next.sort((a, b) => {
        const da = clinicsById.get(a.clinicId)?.distanceKm;
        const db = clinicsById.get(b.clinicId)?.distanceKm;
        return recScore(b.rating, b.reviewCount, db) - recScore(a.rating, a.reviewCount, da);
      });
  }
  return next;
}

export function countActiveFilters(filters: SearchFilters, tab: 'clinics' | 'doctors'): number {
  let n = 0;
  if (filters.specialization) n += 1;
  if (filters.minRating) n += 1;
  if (filters.priceBand !== 'any') n += 1;
  if (filters.distanceBand !== 'any') n += 1;
  if (filters.openNow) n += 1;
  if (tab === 'doctors') {
    if (filters.experienceBand !== 'any') n += 1;
    if (filters.gender !== 'any') n += 1;
  }
  if (filters.sort !== 'recommended') n += 1;
  return n;
}

export function hasNonDefaultFilters(filters: SearchFilters): boolean {
  return (
    filters.specialization != null ||
    filters.minRating > 0 ||
    filters.priceBand !== 'any' ||
    filters.experienceBand !== 'any' ||
    filters.distanceBand !== 'any' ||
    filters.openNow ||
    filters.gender !== 'any' ||
    filters.sort !== DEFAULT_SEARCH_FILTERS.sort
  );
}

function parseHm(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function formatHm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function nextSlotHint(doctor: Doctor): { day: 'today' | 'tomorrow'; time: string } {
  const now = new Date();
  const start = parseHm(doctor.workingHours.start);
  const end = parseHm(doctor.workingHours.end);
  const breakStart = parseHm(doctor.breakTime.start);
  const breakEnd = parseHm(doctor.breakTime.end);
  const step = doctor.appointmentDurationMinutes || 30;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let t = Math.max(start, Math.ceil(nowMin / step) * step);
  if (t >= breakStart && t < breakEnd) t = breakEnd;
  if (t + step <= end) return { day: 'today', time: formatHm(t) };
  return { day: 'tomorrow', time: doctor.workingHours.start };
}
