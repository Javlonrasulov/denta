import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { addDays, format } from 'date-fns';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MASTER_SERVICE_CATALOG } from '../src/services/service-catalog';

/**
 * Appointment complete → charge + payment flow.
 * Requires local Postgres (+ Redis optional).
 */
describe('Finance charges (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let clinicToken: string;
  let doctorToken: string;
  let patientToken: string;
  let clinicId: string;
  let doctorId: string;
  let patientId: string;
  let serviceId: string;
  let appointmentId: string;
  const date = format(addDays(new Date(), 14), 'yyyy-MM-dd');
  const time = '11:00';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = new PrismaClient();
    await prisma.$connect();

    const passwordHash = await argon2.hash('Test1234');
    const suffix = Date.now();

    for (const tpl of MASTER_SERVICE_CATALOG) {
      await prisma.service.upsert({
        where: { nameKey: tpl.nameKey },
        update: {
          name: tpl.translations.uz,
          translations: tpl.translations,
          category: tpl.category,
          defaultDuration: tpl.defaultDuration,
          defaultPriceUzs: tpl.defaultPriceUzs,
        },
        create: {
          name: tpl.translations.uz,
          nameKey: tpl.nameKey,
          translations: tpl.translations,
          category: tpl.category,
          defaultDuration: tpl.defaultDuration,
          defaultPriceUzs: tpl.defaultPriceUzs,
        },
      });
    }

    const filling = await prisma.service.findUniqueOrThrow({
      where: { nameKey: 'service.filling' },
    });
    serviceId = filling.id;

    const owner = await prisma.user.create({
      data: {
        email: `owner-fin-${suffix}@test.local`,
        phone: `+99891${String(suffix).slice(-7)}`,
        passwordHash,
        firstName: 'Owner',
        lastName: 'Finance',
        emailVerifiedAt: new Date(),
      },
    });

    const clinic = await prisma.clinic.create({
      data: {
        name: `Finance Clinic ${suffix}`,
        slug: `finance-clinic-${suffix}`,
        accountStatus: 'ACTIVE',
        isMarketplaceVisible: true,
        bookingEnabled: true,
        phone: owner.phone!,
      },
    });
    clinicId = clinic.id;

    await prisma.userRoleAssignment.create({
      data: { userId: owner.id, role: 'CLINIC_OWNER', clinicId },
    });
    await prisma.clinicMember.create({
      data: {
        clinicId,
        userId: owner.id,
        role: 'CLINIC_OWNER',
        joinedAt: new Date(),
      },
    });
    await prisma.subscription.create({
      data: {
        clinicId,
        status: 'TRIAL',
        trialStartedAt: new Date(),
        trialEndsAt: addDays(new Date(), 30),
        marketplaceBookingEnabled: true,
      },
    });
    await prisma.clinicBranch.create({
      data: {
        clinicId,
        name: 'Main',
        address: 'Test 1',
        city: 'Tashkent',
        latitude: 41.3,
        longitude: 69.2,
        isPrimary: true,
        workingHours: {
          mon: { start: '09:00', end: '18:00' },
        },
      },
    });

    await prisma.clinicService.create({
      data: {
        clinicId,
        serviceId,
        priceUzs: 450_000,
        durationMinutes: 60,
      },
    });

    const doctorUser = await prisma.user.create({
      data: {
        email: `doctor-fin-${suffix}@test.local`,
        phone: `+99892${String(suffix).slice(-7)}`,
        passwordHash,
        firstName: 'Doc',
        lastName: 'Finance',
        emailVerifiedAt: new Date(),
      },
    });
    const doctor = await prisma.doctorProfile.create({
      data: {
        userId: doctorUser.id,
        specialty: 'Therapy',
        appointmentDurationMinutes: 30,
        priceFromUzs: 150_000,
        isActive: true,
      },
    });
    doctorId = doctor.id;
    await prisma.userRoleAssignment.create({
      data: { userId: doctorUser.id, role: 'DOCTOR', clinicId },
    });
    await prisma.doctorClinic.create({
      data: { doctorId, clinicId, isActive: true },
    });
    await prisma.doctorService.create({
      data: { doctorId, serviceId },
    });
    for (let day = 0; day <= 6; day++) {
      await prisma.doctorSchedule.create({
        data: {
          doctorId,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00',
          slotDuration: 30,
        },
      });
    }

    const patientUser = await prisma.user.create({
      data: {
        email: `patient-fin-${suffix}@test.local`,
        phone: `+99893${String(suffix).slice(-7)}`,
        passwordHash,
        firstName: 'Pat',
        lastName: 'Finance',
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.userRoleAssignment.create({
      data: { userId: patientUser.id, role: 'PATIENT' },
    });
    const patient = await prisma.patientProfile.create({
      data: { userId: patientUser.id, displayId: `FIN-${suffix}` },
    });
    patientId = patient.id;
    await prisma.patientClinic.create({
      data: { clinicId, patientId },
    });

    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ identifier: email, password: 'Test1234' })
        .expect(200);
      return res.body.session.accessToken as string;
    };

    clinicToken = await login(owner.email!);
    doctorToken = await login(doctorUser.email!);
    patientToken = await login(patientUser.email!);

    const book = await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId,
        clinicId,
        serviceId,
        date,
        time,
      })
      .expect(201);
    appointmentId = book.body.id;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('A) complete appointment → exactly 1 charge', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'COMPLETED' })
      .expect(200);

    const charges = await prisma.appointmentCharge.findMany({
      where: { appointmentId },
    });
    expect(charges).toHaveLength(1);
    expect(charges[0].amountUzs).toBe(450_000);
    expect(charges[0].paidAmountUzs).toBe(0);
    expect(charges[0].remainingUzs).toBe(450_000);
    expect(charges[0].status).toBe('UNPAID');
  });

  it('B) complete endpoint twice → still 1 charge', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'COMPLETED' })
      .expect(200);

    const charges = await prisma.appointmentCharge.findMany({
      where: { appointmentId },
    });
    expect(charges).toHaveLength(1);
  });

  it('C) partial payment → correct remaining', async () => {
    const charge = await prisma.appointmentCharge.findUniqueOrThrow({
      where: { appointmentId },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/finance/charges/${charge.id}/payments`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({ amount: 200_000, method: 'cash' })
      .expect(201);

    expect(res.body.charge.paidAmount).toBe(200_000);
    expect(res.body.charge.remainingAmount).toBe(250_000);
    expect(res.body.charge.status).toBe('partially_paid');
  });

  it('D) full payment → PAID', async () => {
    const charge = await prisma.appointmentCharge.findUniqueOrThrow({
      where: { appointmentId },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/finance/charges/${charge.id}/payments`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({ amount: 250_000, method: 'card' })
      .expect(201);

    expect(res.body.charge.remainingAmount).toBe(0);
    expect(res.body.charge.status).toBe('paid');
  });

  it('E) clinic finance revenue → only received payments', async () => {
    const summary = await request(app.getHttpServer())
      .get('/api/v1/finance/summary?period=month')
      .set('Authorization', `Bearer ${clinicToken}`)
      .expect(200);

    expect(summary.body.revenue).toBe(450_000);
    expect(summary.body.outstanding).toBe(0);
  });

  it('F) outstanding → unpaid balance after new charge', async () => {
    // Create another completed appointment without paying
    const book2 = await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId,
        clinicId,
        serviceId,
        date,
        time: '12:00',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/appointments/${book2.body.id}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/appointments/${book2.body.id}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'COMPLETED' })
      .expect(200);

    const summary = await request(app.getHttpServer())
      .get('/api/v1/finance/summary?period=month')
      .set('Authorization', `Bearer ${clinicToken}`)
      .expect(200);

    expect(summary.body.revenue).toBe(450_000);
    expect(summary.body.outstanding).toBe(450_000);
  });
});
