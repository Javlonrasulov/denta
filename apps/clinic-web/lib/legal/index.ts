import {
  LEGAL_BILLING,
  LEGAL_BRAND,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_OPERATOR,
  LEGAL_UPDATED_DATE,
  PRIVACY_VERSION,
  TERMS_VERSION,
} from './constants';
import { buildPrivacyUz } from './content/privacy.uz';
import { buildTermsUz } from './content/terms.uz';
import type {
  LegalContext,
  LegalDocumentBuilder,
  LegalDocumentContent,
  LegalDocumentKind,
  LegalLocale,
} from './types';

/**
 * Official text per locale. Uzbek (Latin) is the authoritative version; add
 * `uz-Cyrl` / `ru` / `en` builders here once translations are legally reviewed.
 */
const BUILDERS: Record<LegalDocumentKind, Partial<Record<LegalLocale, LegalDocumentBuilder>>> = {
  terms: { uz: buildTermsUz },
  privacy: { uz: buildPrivacyUz },
};

export const LEGAL_DEFAULT_LOCALE: LegalLocale = 'uz';

export type ResolvedLegalDocument = LegalDocumentContent & {
  version: string;
  effectiveDate: string;
  updatedDate: string;
  /** Locale the text is actually rendered in. */
  locale: LegalLocale;
  /** True when the requested locale has no official text yet. */
  isFallback: boolean;
};

export function legalContext(): LegalContext {
  return { brand: LEGAL_BRAND, operator: LEGAL_OPERATOR, billing: LEGAL_BILLING };
}

export function getLegalDocument(
  kind: LegalDocumentKind,
  requested: LegalLocale,
): ResolvedLegalDocument {
  const builders = BUILDERS[kind];
  const direct = builders[requested];
  const locale: LegalLocale = direct ? requested : LEGAL_DEFAULT_LOCALE;
  const builder = direct ?? builders[LEGAL_DEFAULT_LOCALE];
  if (!builder) {
    throw new Error(`Missing default legal text for "${kind}"`);
  }
  return {
    ...builder(legalContext()),
    version: kind === 'terms' ? TERMS_VERSION : PRIVACY_VERSION,
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    updatedDate: LEGAL_UPDATED_DATE,
    locale,
    isFallback: locale !== requested,
  };
}

export { PRIVACY_VERSION, TERMS_VERSION } from './constants';
export type { LegalDocumentKind, LegalLocale } from './types';
