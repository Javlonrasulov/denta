export type SearchTab = 'clinics' | 'doctors';

export type SearchSort = 'recommended' | 'rating' | 'price' | 'nearest' | 'popular';

export type PriceBand = 'any' | 'lt150' | '150to300' | 'gt300';
export type DistanceBand = 'any' | '2' | '5' | '10';
export type ExperienceBand = 'any' | '5' | '8' | '12';
export type GenderFilter = 'any' | 'male' | 'female';

export type SearchFilters = {
  specialization: string | null;
  minRating: number;
  priceBand: PriceBand;
  experienceBand: ExperienceBand;
  distanceBand: DistanceBand;
  openNow: boolean;
  gender: GenderFilter;
  sort: SearchSort;
};

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  specialization: null,
  minRating: 0,
  priceBand: 'any',
  experienceBand: 'any',
  distanceBand: 'any',
  openNow: false,
  gender: 'any',
  sort: 'recommended',
};

export const SPEC_KEYS = [
  'therapy',
  'orthodontics',
  'implantology',
  'surgery',
  'pediatric',
  'hygiene',
  'aesthetic',
  'prosthodontics',
  'whitening',
] as const;

export type SpecKey = (typeof SPEC_KEYS)[number];
