import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildClientPrivacyUz } from './content/client-privacy.uz';
import { buildClientTermsUz } from './content/client-terms.uz';
import {
  LEGAL_LOCALES,
  type LegalContext,
  type LegalDocumentBuilder,
  type LegalDocumentKind,
  type LegalLocale,
  type LegalVersions,
  type ResolvedLegalDocument,
} from './legal.types';

export const LEGAL_BRAND = 'ORADENT';
export const LEGAL_DOMAIN = 'oradent.uz';
const LEGAL_DEFAULT_LOCALE: LegalLocale = 'uz';
const DEFAULT_LEGAL_DATE = '2026-09-27';

/**
 * Official Client App text per locale. Uzbek (Latin) is authoritative; add
 * other locales only after the translation is legally reviewed.
 */
const CLIENT_BUILDERS: Record<
  LegalDocumentKind,
  Partial<Record<LegalLocale, LegalDocumentBuilder>>
> = {
  terms: { uz: buildClientTermsUz },
  privacy: { uz: buildClientPrivacyUz },
};

const LEGAL_VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class LegalService implements OnModuleInit {
  private readonly logger = new Logger(LegalService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const { termsVersion, privacyVersion } = this.currentVersions();
    for (const [name, value] of [
      ['LEGAL_TERMS_VERSION', termsVersion],
      ['LEGAL_PRIVACY_VERSION', privacyVersion],
    ] as const) {
      if (!LEGAL_VERSION_PATTERN.test(value)) {
        throw new Error(`${name} must be YYYY-MM-DD, got "${value}"`);
      }
    }
    if (this.config.get<string>('app.nodeEnv') !== 'production') return;
    const { operator } = this.context();
    const missing = [
      !operator.legalName && 'LEGAL_OPERATOR_NAME',
      !operator.supportEmail && 'LEGAL_SUPPORT_EMAIL',
      !operator.supportPhone && 'LEGAL_SUPPORT_PHONE',
    ].filter(Boolean);
    if (missing.length > 0) {
      this.logger.warn(
        `Legal documents use neutral contact wording; not configured: ${missing.join(', ')}`,
      );
    }
  }

  /** Server-side source of truth for the documents a new user consents to. */
  currentVersions(): LegalVersions {
    return {
      termsVersion:
        this.config.get<string>('app.legal.termsVersion') ?? DEFAULT_LEGAL_DATE,
      privacyVersion:
        this.config.get<string>('app.legal.privacyVersion') ?? DEFAULT_LEGAL_DATE,
    };
  }

  publicVersions(): LegalVersions & { effectiveDate: string; updatedDate: string } {
    return {
      ...this.currentVersions(),
      effectiveDate: this.effectiveDate(),
      updatedDate: this.updatedDate(),
    };
  }

  getClientDocument(kind: LegalDocumentKind, requested?: string): ResolvedLegalDocument {
    const wanted = resolveLocale(requested);
    const builders = CLIENT_BUILDERS[kind];
    const direct = builders[wanted];
    const locale: LegalLocale = direct ? wanted : LEGAL_DEFAULT_LOCALE;
    const builder = direct ?? builders[LEGAL_DEFAULT_LOCALE];
    if (!builder) {
      throw new Error(`Missing default client legal text for "${kind}"`);
    }
    const versions = this.currentVersions();
    return {
      ...builder(this.context()),
      audience: 'client',
      version: kind === 'terms' ? versions.termsVersion : versions.privacyVersion,
      effectiveDate: this.effectiveDate(),
      updatedDate: this.updatedDate(),
      locale,
      isFallback: locale !== wanted,
    };
  }

  private effectiveDate(): string {
    return this.config.get<string>('app.legal.effectiveDate') ?? DEFAULT_LEGAL_DATE;
  }

  private updatedDate(): string {
    return this.config.get<string>('app.legal.updatedDate') ?? this.effectiveDate();
  }

  private context(): LegalContext {
    return {
      brand: LEGAL_BRAND,
      domain: LEGAL_DOMAIN,
      operator: {
        legalName: this.config.get<string | null>('app.legal.operatorName') ?? null,
        supportEmail: this.config.get<string | null>('app.legal.supportEmail') ?? null,
        privacyEmail: this.config.get<string | null>('app.legal.privacyEmail') ?? null,
        supportPhone: this.config.get<string | null>('app.legal.supportPhone') ?? null,
      },
    };
  }
}

function resolveLocale(value?: string): LegalLocale {
  if (!value) return LEGAL_DEFAULT_LOCALE;
  const exact = LEGAL_LOCALES.find((l) => l.toLowerCase() === value.toLowerCase());
  if (exact) return exact;
  const base = value.split(/[-_]/)[0]?.toLowerCase();
  if (base === 'uz') return /cyrl/i.test(value) ? 'uz-Cyrl' : 'uz';
  return LEGAL_LOCALES.find((l) => l === base) ?? LEGAL_DEFAULT_LOCALE;
}
