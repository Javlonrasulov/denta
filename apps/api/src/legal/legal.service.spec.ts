import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import configuration from '../config/configuration';
import { LegalService } from './legal.service';
import type { LegalDocumentContent } from './legal.types';

function serviceWith(values: Record<string, unknown>): LegalService {
  const config = { get: (key: string) => values[key] } as unknown as ConfigService;
  return new LegalService(config);
}

function allText(doc: LegalDocumentContent): string[] {
  const out = [doc.title, doc.summary];
  for (const section of doc.sections) {
    out.push(section.title);
    for (const block of section.blocks) {
      if (block.type === 'ul') out.push(...block.items);
      else out.push(block.text);
    }
  }
  return out;
}

describe('LegalService', () => {
  it('keeps Terms and Privacy versions independent', () => {
    const legal = serviceWith({
      'app.legal.termsVersion': '2026-10-01',
      'app.legal.privacyVersion': '2026-09-27',
    });
    expect(legal.currentVersions()).toEqual({
      termsVersion: '2026-10-01',
      privacyVersion: '2026-09-27',
    });
    expect(legal.getClientDocument('terms').version).toBe('2026-10-01');
    expect(legal.getClientDocument('privacy').version).toBe('2026-09-27');
  });

  it.each(['terms', 'privacy'] as const)(
    'renders %s without broken placeholders when operator contacts are unset',
    (kind) => {
      const doc = serviceWith({}).getClientDocument(kind);
      for (const text of allText(doc)) {
        expect(text.trim().length).toBeGreaterThan(0);
        expect(text).not.toMatch(/undefined|null|NaN|\[object|TODO/);
        expect(text).not.toMatch(/(Operator|Telefon|xizmati|murojaatlar):\s*$/);
        expect(text).not.toMatch(/—\s*$/);
      }
      const contact = doc.sections.find((s) => s.id === 'contact');
      expect(contact).toBeDefined();
      expect(allText({ ...doc, sections: [contact!] }).join('\n')).toContain('oradent.uz');
    },
  );

  it('renders configured operator contacts', () => {
    const doc = serviceWith({
      'app.legal.operatorName': 'ORADENT MCHJ',
      'app.legal.supportEmail': 'support@oradent.uz',
      'app.legal.privacyEmail': 'privacy@oradent.uz',
      'app.legal.supportPhone': '+998 71 200 00 00',
    }).getClientDocument('privacy');
    const text = allText(doc).join('\n');
    expect(text).toContain('ORADENT platformasi operatori — ORADENT MCHJ');
    expect(text).toContain('privacy@oradent.uz');
    expect(text).toContain('support@oradent.uz');
    expect(text).toContain('+998 71 200 00 00');
  });

  it('falls back to Uzbek for locales without an approved translation', () => {
    const legal = serviceWith({});
    expect(legal.getClientDocument('terms', 'ru')).toMatchObject({ locale: 'uz', isFallback: true });
    expect(legal.getClientDocument('terms', 'UZ')).toMatchObject({ locale: 'uz', isFallback: false });
    expect(legal.getClientDocument('terms', '../../etc/passwd')).toMatchObject({
      locale: 'uz',
      isFallback: false,
    });
  });

  it('refuses to start with a malformed document version', () => {
    expect(() => serviceWith({ 'app.legal.termsVersion': 'v2' }).onModuleInit()).toThrow(
      /LEGAL_TERMS_VERSION/,
    );
    expect(() =>
      serviceWith({ 'app.legal.privacyVersion': '2026-10-01' }).onModuleInit(),
    ).not.toThrow();
  });

  it('warns in production when operator contacts are missing', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    serviceWith({ 'app.nodeEnv': 'production' }).onModuleInit();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('LEGAL_SUPPORT_EMAIL'));
    warn.mockClear();
    serviceWith({ 'app.nodeEnv': 'development' }).onModuleInit();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('legal version defaults', () => {
  const KEYS = [
    'LEGAL_TERMS_VERSION',
    'LEGAL_PRIVACY_VERSION',
    'LEGAL_EFFECTIVE_DATE',
    'LEGAL_UPDATED_DATE',
  ];
  const saved: Record<string, string | undefined> = {};

  beforeAll(() => {
    for (const key of KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });
  afterAll(() => {
    for (const key of KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it('match clinic-web defaults so both apps accept the same versions', () => {
    const api = configuration().legal;
    const clinic = readFileSync(
      join(__dirname, '../../../clinic-web/lib/legal/constants.ts'),
      'utf8',
    );
    const clinicDefault = (env: string) =>
      new RegExp(`${env}\\)\\s*\\?\\?\\s*'([^']+)'`).exec(clinic)?.[1];

    expect(clinicDefault('NEXT_PUBLIC_LEGAL_TERMS_VERSION')).toBe(api.termsVersion);
    expect(clinicDefault('NEXT_PUBLIC_LEGAL_PRIVACY_VERSION')).toBe(api.privacyVersion);
    expect(clinicDefault('NEXT_PUBLIC_LEGAL_EFFECTIVE_DATE')).toBe(api.effectiveDate);
  });

  it('treats blank env values as unset', () => {
    process.env.LEGAL_TERMS_VERSION = '  ';
    expect(configuration().legal.termsVersion).toBe('2026-09-27');
    delete process.env.LEGAL_TERMS_VERSION;
  });
});
