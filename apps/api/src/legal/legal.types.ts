/**
 * Same block shape as clinic-web `lib/legal/types.ts`, so both renderers stay
 * interchangeable.
 */
export type LegalDocumentKind = 'terms' | 'privacy';

export type LegalLocale = 'uz' | 'uz-Cyrl' | 'ru' | 'en';

export const LEGAL_LOCALES: readonly LegalLocale[] = ['uz', 'uz-Cyrl', 'ru', 'en'];

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  /** Visually emphasised paragraph for key obligations. */
  | { type: 'note'; text: string };

export type LegalSection = {
  /** Stable anchor id — do not rename once published. */
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

export type LegalOperator = {
  legalName: string | null;
  supportEmail: string | null;
  privacyEmail: string | null;
  supportPhone: string | null;
};

export type LegalContext = {
  brand: string;
  domain: string;
  operator: LegalOperator;
};

export type LegalDocumentBuilder = (ctx: LegalContext) => LegalDocumentContent;

export type LegalVersions = {
  termsVersion: string;
  privacyVersion: string;
};

export type ResolvedLegalDocument = LegalDocumentContent & {
  audience: 'client';
  version: string;
  effectiveDate: string;
  updatedDate: string;
  /** Locale the text is actually rendered in. */
  locale: LegalLocale;
  /** True when the requested locale has no official text yet. */
  isFallback: boolean;
};
