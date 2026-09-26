import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppointmentStatus, AppointmentSource, PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { addDays } from 'date-fns';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Concurrency: 10 parallel bookings for the same slot → 1 success, 9 SLOT_TAKEN.
 * Requires local Postgres + Redis (or memory fallback).
 */
describe('Booking concurrency (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let patientToken: string;
  let doctorId: string;
  let clinicId: string;
  let patientId: string;
  let serviceId: string;
  const date = '2030-06-15';
  const time = '10:00';

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

    const owner = await prisma.user.create({
      data: {
        email: `owner-conc-${suffix}@test.local`,
        phone: `+99890${String(suffix).slice(-7)}`,
        passwordHash,
        firstName: 'Owner',
        lastName: 'Test',
        emailVerifiedAt: new Date(),
      },
    });

    const clinic = await prisma.clinic.create({
      data: {
        name: `Conc Clinic ${suffix}`,
        slug: `conc-clinic-${suffix}`,
        accountStatus: 'ACTIVE',
        isMarketplaceVisible: true,
        bookingEnabled: true,
        phone: owner.phone!,
      },
    });
    clinicId = clinic.id;

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
        address: 'Tashkent',
        city: 'Toshkent',
        latitude: 41.3111,
        longitude: 69.2797,
        isPrimary: true,
      },
    });

    const doctorUser = await prisma.user.create({
      data: {
        email: `doc-conc-${suffix}@test.local`,
        phone: `+99891${String(suffix).slice(-7)}`,
        passwordHash,
        firstName: 'Doc',
        lastName: 'Conc',
        emailVerifiedAt: new Date(),
      },
    });

    const doctor = await prisma.doctorProfile.create({
      data: {
        userId: doctorUser.id,
        specialty: 'General',
        appointmentDurationMinutes: 30,
        isActive: true,
      },
    });
    doctorId = doctor.id;

    const doctorClinic = await prisma.doctorClinic.create({
      data: { doctorId, clinicId, isActive: true },
    });

    let service = await prisma.service.findFirst({
      where: { nameKey: 'service.consultation' },
    });
    if (!service) {
      service = await prisma.service.create({
        data: {
          name: 'Konsultatsiya',
          nameKey: 'service.consultation',
          category: 'general',
          defaultDuration: 30,
          defaultPriceUzs: 150_000,
        },
      });
    }
    await prisma.clinicService.upsert({
      where: {
        clinicId_serviceId: { clinicId, serviceId: service.id },
      },
      update: { isActive: true },
      create: {
        clinicId,
        serviceId: service.id,
        priceUzs: 150_000,
        durationMinutes: 30,
      },
    });
    await prisma.doctorService.upsert({
      where: {
        doctorId_serviceId: { doctorId, serviceId: service.id },
      },
      update: { isActive: true },
      create: { doctorId, serviceId: service.id },
    });
    serviceId = service.id;

    // Also create all weekdays to be safe
    for (let d = 0; d <= 6; d++) {
      await prisma.doctorSchedule.upsert({
        where: {
          doctorClinicId_dayOfWeek: {
            doctorClinicId: doctorClinic.id,
            dayOfWeek: d,
          },
        },
        create: {
          doctorId,
          doctorClinicId: doctorClinic.id,
          dayOfWeek: d,
          startTime: '09:00',
          endTime: '18:00',
          breakStart: '13:00',
          breakEnd: '14:00',
          slotDuration: 30,
        },
        update: {},
      });
    }

    const patientUser = await prisma.user.create({
      data: {
        email: `pat-conc-${suffix}@test.local`,
        phone: `+99893${String(suffix).slice(-7)}`,
        passwordHash,
        firstName: 'Pat',
        lastName: 'Conc',
        emailVerifiedAt: new Date(),
      },
    });

    await prisma.userRoleAssignment.create({
      data: { userId: patientUser.id, role: 'PATIENT' },
    });

    const patient = await prisma.patientProfile.create({
      data: { userId: patientUser.id, displayId: `DNT-C${suffix}` },
    });
    patientId = patient.id;

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: patientUser.email,
        password: 'Test1234',
      });

    // Patient login may need role — if session null, mint JWT via doctor path won't work.
    // Create tokens by verifying patient can login after patient register flow.
    if (login.body?.session?.accessToken) {
      patientToken = login.body.session.accessToken;
    } else {
      // Fallback: register patient → immediate session (no email OTP at signup)
      const email = `pat2-conc-${suffix}@test.local`;
      const reg = await request(app.getHttpServer())
        .post('/api/v1/auth/patient/register')
        .send({
          firstName: 'Pat2',
          lastName: 'Conc',
          phone: `+99894${String(suffix).slice(-7)}`,
          email,
          password: 'Test1234',
        });
      expect(reg.status).toBeLessThan(400);
      patientToken =
        reg.body.accessToken ?? reg.body.session?.accessToken;
      // Use this patient's profile for booking
      const me = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${patientToken}`);
      // patientId from createAppointment resolves via actor user
      void me;
      void patientId;
    }
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('allows only one of 10 concurrent bookings for the same slot', async () => {
    const body = {
      doctorId,
      clinicId,
      serviceId,
      date,
      time,
      source: AppointmentSource.CLIENT_APP,
    };

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .post('/api/v1/appointments')
          .set('Authorization', `Bearer ${patientToken}`)
          .send(body),
      ),
    );

    const success = results.filter((r) => r.status === 201 || r.status === 200);
    const taken = results.filter(
      (r) =>
        r.status === 409 &&
        (r.body?.code === 'SLOT_TAKEN' ||
          r.body?.code === 'APPOINTMENT_SLOT_TAKEN'),
    );

    expect(success.length).toBe(1);
    expect(taken.length).toBe(9);

    const active = await prisma.appointment.count({
      where: {
        doctorId,
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      },
    });
    expect(active).toBeGreaterThanOrEqual(1);
  }, 60_000);
});
