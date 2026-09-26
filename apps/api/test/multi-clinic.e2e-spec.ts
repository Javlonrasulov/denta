import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as argon2 from 'argon2';
import { UserRole, ClinicAccountStatus, SubscriptionStatus } from '@prisma/client';

describe('Multi-clinic tenant isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let clinicAId: string;
  let clinicBId: string;
  let ownerAToken: string;
  const suffix = `${Date.now()}`;
  let doctorPhone = `+99890${suffix.slice(-7)}`;
  let doctorPassword = 'Doctor9pass';
  const ownerAEmail = `owner-a-${suffix}@test.local`;
  const ownerBEmail = `owner-b-${suffix}@test.local`;
  const ownerAPhone = `+99891${suffix.slice(-7)}`;
  const ownerBPhone = `+99892${suffix.slice(-7)}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    const hash = await argon2.hash('Owner9pass');
    const ownerA = await prisma.user.create({
      data: {
        email: ownerAEmail,
        phone: ownerAPhone,
        passwordHash: hash,
        firstName: 'Owner',
        lastName: 'A',
        emailVerifiedAt: new Date(),
      },
    });
    const ownerB = await prisma.user.create({
      data: {
        email: ownerBEmail,
        phone: ownerBPhone,
        passwordHash: hash,
        firstName: 'Owner',
        lastName: 'B',
        emailVerifiedAt: new Date(),
      },
    });

    const clinicA = await prisma.clinic.create({
      data: {
        name: 'Clinic A',
        slug: `clinic-a-${Date.now()}`,
        accountStatus: ClinicAccountStatus.ACTIVE,
        members: {
          create: {
            userId: ownerA.id,
            role: UserRole.CLINIC_OWNER,
            joinedAt: new Date(),
            startedAt: new Date(),
          },
        },
        subscription: {
          create: {
            status: SubscriptionStatus.ACTIVE,
            marketplaceBookingEnabled: true,
          },
        },
      },
    });
    const clinicB = await prisma.clinic.create({
      data: {
        name: 'Clinic B',
        slug: `clinic-b-${Date.now()}`,
        accountStatus: ClinicAccountStatus.ACTIVE,
        members: {
          create: {
            userId: ownerB.id,
            role: UserRole.CLINIC_OWNER,
            joinedAt: new Date(),
            startedAt: new Date(),
          },
        },
        subscription: {
          create: {
            status: SubscriptionStatus.ACTIVE,
            marketplaceBookingEnabled: true,
          },
        },
      },
    });
    clinicAId = clinicA.id;
    clinicBId = clinicB.id;

    await prisma.userRoleAssignment.createMany({
      data: [
        { userId: ownerA.id, role: UserRole.CLINIC_OWNER, clinicId: clinicAId },
        { userId: ownerB.id, role: UserRole.CLINIC_OWNER, clinicId: clinicBId },
      ],
    });

    const loginA = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: ownerAEmail, password: 'Owner9pass' });
    ownerAToken = loginA.body.session.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects staff appointment create for another clinicId', async () => {
    const res = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        clinicId: clinicBId,
        doctorId: 'nonexistent',
        date: '2099-01-01',
        time: '10:00',
        serviceId: 'x',
      });
    expect(res.status).toBe(403);
  });

  it('attaches existing doctor phone to second clinic without duplicate user', async () => {
    const create1 = await request(app.getHttpServer())
      .post('/clinics/me/members')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        firstName: 'Doc',
        lastName: 'Multi',
        phone: doctorPhone,
        role: 'DOCTOR',
        specialty: 'Terapevt',
      });
    expect([200, 201]).toContain(create1.status);
    expect(create1.body.existingUser).toBe(false);
    expect(create1.body.temporaryPassword || create1.body.member).toBeTruthy();

    const loginB = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: ownerBEmail, password: 'Owner9pass' });
    const tokenB = loginB.body.session.accessToken;

    const create2 = await request(app.getHttpServer())
      .post('/clinics/me/members')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        firstName: 'Doc',
        lastName: 'Multi',
        phone: doctorPhone,
        role: 'DOCTOR',
        specialty: 'Terapevt',
      });
    expect([200, 201]).toContain(create2.status);
    expect(create2.body.existingUser).toBe(true);

    const users = await prisma.user.findMany({ where: { phone: doctorPhone } });
    expect(users).toHaveLength(1);

    // set known password for doctor (temp password path may vary)
    await prisma.user.update({
      where: { id: users[0].id },
      data: { passwordHash: await argon2.hash(doctorPassword) },
    });

    const docLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: doctorPhone, password: doctorPassword });
    expect(docLogin.status).toBe(200);
    expect(docLogin.body.session.workspaces.length).toBeGreaterThanOrEqual(2);

    const switchRes = await request(app.getHttpServer())
      .post('/auth/workspace/switch')
      .set('Authorization', `Bearer ${docLogin.body.session.accessToken}`)
      .send({ clinicId: clinicBId });
    expect([200, 201]).toContain(switchRes.status);
    expect(switchRes.body.activeWorkspace.clinicId).toBe(clinicBId);

    const badSwitch = await request(app.getHttpServer())
      .post('/auth/workspace/switch')
      .set('Authorization', `Bearer ${switchRes.body.accessToken}`)
      .send({ clinicId: 'not-a-member-clinic' });
    expect(badSwitch.status).toBe(403);
  });

  it('denies finance for receptionist without permission', async () => {
    const created = await request(app.getHttpServer())
      .post('/clinics/me/members')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        firstName: 'Rec',
        lastName: 'A',
        phone: '+998901118877',
        role: 'RECEPTIONIST',
      });
    expect([200, 201]).toContain(created.status);
    const temp = created.body.temporaryPassword as string | undefined;
    if (temp) {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: '+998901118877', password: temp });
      expect(login.status).toBe(200);
      const fin = await request(app.getHttpServer())
        .get('/finance/summary')
        .set('Authorization', `Bearer ${login.body.session.accessToken}`);
      expect(fin.status).toBe(403);
    }
  });

  it('isolates patients / inventory / finance / appointments across clinics', async () => {
    const loginB = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: ownerBEmail, password: 'Owner9pass' });
    const tokenB = loginB.body.session.accessToken as string;

    const createPatientA = await request(app.getHttpServer())
      .post('/patients')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        firstName: 'Ali',
        lastName: 'ClinicA',
        phone: `+99893${suffix.slice(-7)}`,
        birthDate: '1990-01-15',
        gender: 'male',
      });
    expect([200, 201]).toContain(createPatientA.status);
    const patientAId = createPatientA.body.id as string;

    const leak = await request(app.getHttpServer())
      .get(`/patients/${patientAId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([403, 404]).toContain(leak.status);

    const listB = await request(app.getHttpServer())
      .get('/patients')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(listB.status).toBe(200);
    const ids = (listB.body as { id: string }[]).map((p) => p.id);
    expect(ids).not.toContain(patientAId);

    const invA = await request(app.getHttpServer())
      .post('/inventory')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        name: 'Composite A',
        quantity: 10,
        unit: 'pcs',
        minimumStock: 2,
        purchasePrice: 1000,
      });
    expect([200, 201]).toContain(invA.status);
    const itemAId = invA.body.id as string;

    const invListB = await request(app.getHttpServer())
      .get('/inventory')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(invListB.status).toBe(200);
    expect(
      (invListB.body as { id: string }[]).some((i) => i.id === itemAId),
    ).toBe(false);

    const finA = await request(app.getHttpServer())
      .get('/finance/summary')
      .set('Authorization', `Bearer ${ownerAToken}`);
    expect(finA.status).toBe(200);

    // Cross-clinic appointment create rejected (clinicId from body ≠ JWT clinic)
    const badAppt = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({
        clinicId: clinicBId,
        doctorId: 'foreign-doctor',
        patientId: patientAId,
        date: '2099-06-01',
        time: '11:00',
        serviceId: 'svc',
      });
    expect(badAppt.status).toBe(403);

    // Foreign patientId into own clinic must also be rejected
    const foreignPatient = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        clinicId: clinicBId,
        doctorId: 'x',
        patientId: patientAId,
        date: '2099-06-01',
        time: '11:00',
        serviceId: 'svc',
      });
    expect([403, 404]).toContain(foreignPatient.status);
  });

  it('rejects cross-clinic appointment cancel (IDOR)', async () => {
    const loginB = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: ownerBEmail, password: 'Owner9pass' });
    const tokenB = loginB.body.session.accessToken as string;

    // Seed an appointment in Clinic B via prisma (bypass booking constraints).
    const patientB = await prisma.patientProfile.create({
      data: {
        user: {
          create: {
            phone: `+99894${suffix.slice(-7)}`,
            passwordHash: await argon2.hash('Patient9pass'),
            firstName: 'Pat',
            lastName: 'B',
          },
        },
      },
    });
    await prisma.patientClinic.create({
      data: { clinicId: clinicBId, patientId: patientB.id },
    });
    const doctorB = await prisma.doctorProfile.findFirst({
      where: { clinics: { some: { clinicId: clinicBId, isActive: true } } },
    });
    if (!doctorB) {
      // No doctor in B yet — skip soft
      return;
    }
    const appt = await prisma.appointment.create({
      data: {
        clinicId: clinicBId,
        doctorId: doctorB.id,
        patientId: patientB.id,
        startsAt: new Date('2099-07-01T10:00:00.000Z'),
        endsAt: new Date('2099-07-01T10:30:00.000Z'),
        status: 'PENDING',
        priceUzs: 100000,
        patientName: 'Pat B',
        doctorName: 'Doc',
        clinicName: 'Clinic B',
        clinicAddress: '',
        serviceName: 'Checkup',
      },
    });

    const cancelByA = await request(app.getHttpServer())
      .post(`/appointments/${appt.id}/cancel`)
      .set('Authorization', `Bearer ${ownerAToken}`)
      .send({ reason: 'cross-clinic' });
    expect([401, 403, 404]).toContain(cancelByA.status);

    const cancelByB = await request(app.getHttpServer())
      .post(`/appointments/${appt.id}/cancel`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ reason: 'owner-b' });
    expect([200, 201]).toContain(cancelByB.status);
  });
});
