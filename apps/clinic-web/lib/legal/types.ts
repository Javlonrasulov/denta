import type { LegalBillingTerms, LegalOperator } from './constants';

export type LegalDocumentKind = 'terms' | 'privacy';

export type LegalLocale = 'uz' | 'uz-Cyrl' | 'ru' | 'en';

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  /** Visually emphasised paragraph for key obligations. */
  | { type: 'note'; text: string };

export type LegalSection = {
  /** Stable anchor id — do not rename once published (external links). */
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocumentContent = {
  kind: LegalDocumentKind;
  title: string;
  summary: string;
  sections: LegalSection[];
};

export type LegalContext = {
  brand: string;
  operator: LegalOperator;
  billing: LegalBillingTerms;
};

export type LegalDocumentBuilder = (ctx: LegalContext) => LegalDocumentContent;
