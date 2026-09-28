/**
 * Legal document configuration.
 *
 * Every value here is either an env override or a neutral default. Values that
 * still require confirmation by a lawyer are listed in `LEGAL_REVIEW_FIELDS`
 * and in `docs/LEGAL_REVIEW.md`; they must never surface as "TODO" in the UI.
 */

function envString(value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

function envInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt((value ?? '').trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const LEGAL_BRAND = 'ORADENT';
export const LEGAL_DOMAIN = 'oradent.uz';

/** Bump together with API `LEGAL_TERMS_VERSION` / `LEGAL_PRIVACY_VERSION`. */
export const TERMS_VERSION =
  envString(process.env.NEXT_PUBLIC_LEGAL_TERMS_VERSION) ?? '2026-09-27';
export const PRIVACY_VERSION =
  envString(process.env.NEXT_PUBLIC_LEGAL_PRIVACY_VERSION) ?? '2026-09-27';

export const LEGAL_EFFECTIVE_DATE =
  envString(process.env.NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE) ?? '2026-09-27';
export const LEGAL_UPDATED_DATE =
  envString(process.env.NEXT_PUBLIC_LEGAL_UPDATED_DATE) ?? LEGAL_EFFECTIVE_DATE;

export type LegalOperator = {
  /** Registered legal name of the operator; null until confirmed. */
  legalName: string | null;
  /** STIR (taxpayer identification number). */
  tin: string | null;
  legalAddress: string | null;
  supportEmail: string | null;
  privacyEmail: string | null;
  supportPhone: string | null;
};

export const LEGAL_OPERATOR: LegalOperator = {
  legalName: envString(process.env.NEXT_PUBLIC_LEGAL_OPERATOR_NAME),
  tin: envString(process.env.NEXT_PUBLIC_LEGAL_OPERATOR_TIN),
  legalAddress: envString(process.env.NEXT_PUBLIC_LEGAL_OPERATOR_ADDRESS),
  supportEmail: envString(process.env.NEXT_PUBLIC_LEGAL_SUPPORT_EMAIL),
  privacyEmail:
    envString(process.env.NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL) ??
    envString(process.env.NEXT_PUBLIC_LEGAL_SUPPORT_EMAIL),
  supportPhone:
    envString(process.env.NEXT_PUBLIC_LEGAL_SUPPORT_PHONE) ??
    envString(process.env.NEXT_PUBLIC_SUPPORT_PHONE),
};

export type LegalBillingTerms = {
  trialDays: number;
  /** Days after the due date before paid features may be limited. */
  graceDays: number;
  /** Calendar days of non-payment before the service may be suspended. */
  suspensionDays: number;
};

export const LEGAL_BILLING: LegalBillingTerms = {
  trialDays: 30,
  graceDays: envInt(process.env.NEXT_PUBLIC_LEGAL_GRACE_DAYS, 5),
  suspensionDays: envInt(process.env.NEXT_PUBLIC_LEGAL_SUSPENSION_DAYS, 30),
};

export type LegalReviewField = {
  key: string;
  label: string;
  /** Where the value is configured once confirmed. */
  source: string;
  resolved: boolean;
};

/** Machine-readable legal-review checklist (mirrors docs/LEGAL_REVIEW.md). */
export const LEGAL_REVIEW_FIELDS: LegalReviewField[] = [
  {
    key: 'operatorLegalName',
    label: 'Operator legal name',
    source: 'NEXT_PUBLIC_LEGAL_OPERATOR_NAME',
    resolved: LEGAL_OPERATOR.legalName !== null,
  },
  {
    key: 'operatorTin',
    label: 'STIR / company registration details',
    source: 'NEXT_PUBLIC_LEGAL_OPERATOR_TIN',
    resolved: LEGAL_OPERATOR.tin !== null,
  },
  {
    key: 'operatorAddress',
    label: 'Legal address',
    source: 'NEXT_PUBLIC_LEGAL_OPERATOR_ADDRESS',
    resolved: LEGAL_OPERATOR.legalAddress !== null,
  },
  {
    key: 'supportEmail',
    label: 'Support email',
    source: 'NEXT_PUBLIC_LEGAL_SUPPORT_EMAIL',
    resolved: LEGAL_OPERATOR.supportEmail !== null,
  },
  {
    key: 'privacyEmail',
    label: 'Privacy / personal data contact email',
    source: 'NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL',
    resolved: LEGAL_OPERATOR.privacyEmail !== null,
  },
  {
    key: 'governingLaw',
    label: 'Governing law wording',
    source: 'lib/legal/content/terms.uz.ts → section "disputes"',
    resolved: false,
  },
  {
    key: 'disputeJurisdiction',
    label: 'Dispute jurisdiction (court / arbitration venue)',
    source: 'lib/legal/content/terms.uz.ts → section "disputes"',
    resolved: false,
  },
  {
    key: 'retentionPeriods',
    label: 'Exact data retention periods (medical, accounting, logs, backups)',
    source: 'lib/legal/content/privacy.uz.ts → section "retention"',
    resolved: false,
  },
  {
    key: 'penaltyFormula',
    label: 'Late-payment penalty formula (only via contract / commercial offer)',
    source: 'Commercial offer / service agreement',
    resolved: false,
  },
  {
    key: 'liabilityCap',
    label: 'Liability cap wording',
    source: 'lib/legal/content/terms.uz.ts → section "liability"',
    resolved: false,
  },
  {
    key: 'refundPolicy',
    label: 'Subscription refund policy',
    source: 'lib/legal/content/terms.uz.ts → sections "subscription", "termination"',
    resolved: false,
  },
  {
    key: 'infrastructureFacts',
    label: 'Production HTTPS/TLS and database backups confirmed',
    source: 'Infrastructure + privacy.uz.ts → section "security"',
    resolved: false,
  },
  {
    key: 'minorsAge',
    label: 'Age threshold and guardian consent rules for minors',
    source: 'lib/legal/content/privacy.uz.ts → section "minors"',
    resolved: false,
  },
  {
    key: 'dataLocalization',
    label: 'Personal data storage location / localization compliance',
    source: 'Infrastructure + privacy.uz.ts → section "security"',
    resolved: false,
  },
];
