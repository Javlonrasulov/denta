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
