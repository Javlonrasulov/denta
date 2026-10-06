import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Clinic registration legal consent (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = `${Date.now()}`;
  const emails: string[] = [];

  function payload(n: number, extra: Record<string, unknown> = {}) {
    const email = `legal-${n}-${suffix}@test.local`;
    emails.push(email);
    return {
      clinicName: `Legal Clinic ${n}`,
      adminFirstName: 'Legal',
      adminLastName: 'Owner',
      phone: `+99893${n}${suffix.slice(-6)}`,
      email,
      password: 'Legal9pass',
      ...extra,
    };
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, clinicMemberships: { select: { clinicId: true } } },
    });
    const clinicIds = users.flatMap((u) => u.clinicMemberships.map((m) => m.clinicId));
    await prisma.auditLog.deleteMany({ where: { clinicId: { in: clinicIds } } });
    await prisma.clinic.deleteMany({ where: { id: { in: clinicIds } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
    await app.close();
  });

  it.each([
    ['missing', {}],
    ['false', { acceptTerms: false }],
    ['string "true"', { acceptTerms: 'true' }],
  ])('rejects registration when consent is %s', async (_label, extra) => {
    const body = payload(1, extra);
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/clinic/register')
      .send(body)
      .expect(400);
    expect(res.body.code).toBe('LEGAL_CONSENT_REQUIRED');
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    expect(user).toBeNull();
  });

  it('rejects an outdated document version', async () => {
    const body = payload(2, { acceptTerms: true, termsVersion: '1999-01-01' });
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/clinic/register')
      .send(body)
      .expect(400);
    expect(res.body.code).toBe('LEGAL_CONSENT_REQUIRED');
    expect(res.body.details?.outdated).toBe(true);
  });

  it('stores a versioned consent record on successful registration', async () => {
    const body = payload(3, { acceptTerms: true });
    await request(app.getHttpServer())
      .post('/api/v1/auth/clinic/register')
      .set('User-Agent', 'legal-e2e')
      .send(body)
      .expect(201);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: body.email },
      include: { legalConsents: true, clinicMemberships: true },
    });
    expect(user.legalConsents).toHaveLength(1);
    const consent = user.legalConsents[0];
    expect(consent.context).toBe('CLINIC_REGISTRATION');
    expect(consent.termsVersion).toBeTruthy();
    expect(consent.privacyVersion).toBeTruthy();
    expect(consent.acceptedAt).toBeInstanceOf(Date);
    expect(consent.userAgent).toBe('legal-e2e');
    expect(consent.clinicId).toBe(user.clinicMemberships[0]?.clinicId);

    const audit = await prisma.auditLog.findFirst({
      where: { entity: 'LegalConsent', entityId: consent.id },
    });
    expect(audit?.action).toBe('legal.consent.accepted');
  });
});

describe('Patient registration legal consent (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = `${Date.now()}`.slice(-6);
  const emails: string[] = [];

  function payload(n: number, extra: Record<string, unknown> = {}) {
    const email = `legal-pat-${n}-${suffix}@test.local`;
    emails.push(email);
    return {
      firstName: 'Legal',
      lastName: 'Patient',
      email,
      phone: `+9989${n}1${suffix}`,
      password: 'secret1',
      ...extra,
    };
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await app.close();
  });

  it.each([
    ['missing', {}],
    ['false', { acceptTerms: false }],
    ['string "true"', { acceptTerms: 'true' }],
    ['1', { acceptTerms: 1 }],
  ])('rejects direct API registration when consent is %s', async (_label, extra) => {
    const body = payload(1, extra);
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/patient/register')
      .send(body)
      .expect(400);
    expect(res.body.code).toBe('LEGAL_CONSENT_REQUIRED');
    expect(res.body.accessToken).toBeUndefined();
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    expect(user).toBeNull();
  });

  it('rejects an outdated or arbitrary document version', async () => {
    const body = payload(2, { acceptTerms: true, privacyVersion: '2099-01-01' });
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/patient/register')
      .send(body)
      .expect(400);
    expect(res.body.code).toBe('LEGAL_CONSENT_REQUIRED');
    expect(res.body.details?.outdated).toBe(true);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    expect(user).toBeNull();
  });

  it('rejects a client-supplied consent timestamp', async () => {
    const body = payload(3, { acceptTerms: true, acceptedAt: '2000-01-01T00:00:00Z' });
    await request(app.getHttpServer())
      .post('/api/v1/auth/patient/register')
      .send(body)
      .expect(400);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    expect(user).toBeNull();
  });

  it('stores the server-side current versions and acceptedAt on success', async () => {
    const versions = await request(app.getHttpServer())
      .get('/api/v1/legal/versions')
      .expect(200);
    const before = Date.now();
    const body = payload(4, {
      acceptTerms: true,
      termsVersion: versions.body.termsVersion,
      privacyVersion: versions.body.privacyVersion,
      locale: 'ru',
    });
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/patient/register')
      .set('User-Agent', 'legal-pat-e2e')
      .send(body)
      .expect(201);
    expect(res.body.accessToken).toBeTruthy();

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: body.email },
      include: { legalConsents: true, patientProfile: true },
    });
    expect(user.patientProfile).not.toBeNull();
    expect(user.legalConsents).toHaveLength(1);
    const consent = user.legalConsents[0];
    expect(consent.context).toBe('PATIENT_REGISTRATION');
    expect(consent.clinicId).toBeNull();
    expect(consent.termsVersion).toBe(versions.body.termsVersion);
    expect(consent.privacyVersion).toBe(versions.body.privacyVersion);
    expect(consent.locale).toBe('ru');
    expect(consent.userAgent).toBe('legal-pat-e2e');
    expect(consent.acceptedAt.getTime()).toBeGreaterThanOrEqual(before - 5_000);

    const audit = await prisma.auditLog.findFirst({
      where: { entity: 'LegalConsent', entityId: consent.id },
    });
    expect(audit?.action).toBe('legal.consent.accepted');
  });

  it('leaves no user or consent behind when registration fails', async () => {
    const first = payload(5, { acceptTerms: true });
    await request(app.getHttpServer())
      .post('/api/v1/auth/patient/register')
      .send(first)
      .expect(201);

    const dup = payload(6, { acceptTerms: true, phone: first.phone });
    await request(app.getHttpServer())
      .post('/api/v1/auth/patient/register')
      .send(dup)
      .expect(409);
    const user = await prisma.user.findUnique({ where: { email: dup.email } });
    expect(user).toBeNull();
    const firstUser = await prisma.user.findUniqueOrThrow({
      where: { email: first.email },
      include: { legalConsents: true },
    });
    expect(firstUser.legalConsents).toHaveLength(1);
  });

  it('rejects a duplicate email without creating another user or consent', async () => {
    const first = payload(8, { acceptTerms: true });
    await request(app.getHttpServer())
      .post('/api/v1/auth/patient/register')
      .send(first)
      .expect(201);

    const dup = { ...payload(9, { acceptTerms: true }), email: first.email };
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/patient/register')
      .send(dup)
      .expect(409);
    expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
    expect(await prisma.user.findUnique({ where: { phone: dup.phone } })).toBeNull();
    const consents = await prisma.legalConsent.count({
      where: { user: { email: first.email } },
    });
    expect(consents).toBe(1);
  });

  it('creates exactly one user and consent for a double-submitted registration', async () => {
    const body = payload(0, { acceptTerms: true });
    const send = () =>
      request(app.getHttpServer()).post('/api/v1/auth/patient/register').send(body);
    const results = await Promise.all([send(), send(), send()]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(2);
    for (const r of results.filter((x) => x.status === 409)) {
      expect(['EMAIL_ALREADY_EXISTS', 'PHONE_ALREADY_EXISTS']).toContain(r.body.code);
    }
    expect(await prisma.user.count({ where: { email: body.email } })).toBe(1);
    expect(
      await prisma.legalConsent.count({ where: { user: { email: body.email } } }),
    ).toBe(1);
  });

  it('keeps login free of consent prompts for existing users', async () => {
    const body = payload(7, { acceptTerms: true });
    await request(app.getHttpServer())
      .post('/api/v1/auth/patient/register')
      .send(body)
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: body.email, password: body.password });
    expect(login.status).toBeLessThan(300);
    expect(login.body.session?.accessToken ?? login.body.accessToken).toBeTruthy();
  });

  it.each(['terms', 'privacy'])('serves the Client App %s document', async (kind) => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/legal/client/${kind}`)
      .query({ locale: 'en' })
      .expect(200);
    expect(res.body.kind).toBe(kind);
    expect(res.body.audience).toBe('client');
    expect(res.body.version).toBeTruthy();
    expect(res.body.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(res.body.locale).toBe('uz');
    expect(res.body.isFallback).toBe(true);
    expect(res.body.sections.length).toBeGreaterThan(5);
  });

  it('returns 404 for unknown legal documents', async () => {
    await request(app.getHttpServer()).get('/api/v1/legal/client/cookies').expect(404);
    const res = await request(app.getHttpServer())
      .get('/api/v1/legal/client/..%2F..%2Fpackage.json')
      .expect(404);
    expect(res.body).toEqual(
      expect.not.objectContaining({ stack: expect.anything() }),
    );
  });

  it('ignores malformed locale query values', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/legal/client/terms?locale=ru&locale=en&locale[x]=1')
      .expect(200);
    expect(res.body.locale).toBe('uz');
  });
});
