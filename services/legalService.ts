/**
 * Client App edition of Terms / Privacy, served by the API so the text and
 * version always match what the server records at registration.
 */
import { useQuery } from '@tanstack/react-query';

import { apiGet } from './apiClient';
import type { LocaleCode as Locale } from '@/types';

export type LegalDocumentKind = 'terms' | 'privacy';

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'note'; text: string };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type ClientLegalDocument = {
  kind: LegalDocumentKind;
  audience: 'client';
  title: string;
  summary: string;
  sections: LegalSection[];
  version: string;
  effectiveDate: string;
  updatedDate: string;
  locale: Locale;
  isFallback: boolean;
};

export type LegalVersions = {
  termsVersion: string;
  privacyVersion: string;
  effectiveDate: string;
  updatedDate: string;
};

export function fetchClientLegalDocument(
  kind: LegalDocumentKind,
  locale: Locale,
): Promise<ClientLegalDocument> {
  return apiGet<ClientLegalDocument>(`/legal/client/${kind}`, { locale }, false);
}

export function fetchLegalVersions(): Promise<LegalVersions> {
  return apiGet<LegalVersions>('/legal/versions', undefined, false);
}

export function useClientLegalDocument(kind: LegalDocumentKind, locale: Locale) {
  return useQuery({
    queryKey: ['legal', 'client', kind, locale],
    queryFn: () => fetchClientLegalDocument(kind, locale),
    staleTime: 10 * 60_000,
  });
}

export function useLegalVersions() {
  return useQuery({
    queryKey: ['legal', 'versions'],
    queryFn: fetchLegalVersions,
    staleTime: 5 * 60_000,
  });
}
