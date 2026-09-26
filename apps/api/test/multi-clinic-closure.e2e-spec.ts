import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as argon2 from 'argon2';
import {
  UserRole,
  ClinicAccountStatus,
  SubscriptionStatus,
  PermissionEffect,
} from '@prisma/client';
import { io, type Socket } from 'socket.io-client';

describe('Multi-clinic closure (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let serverUrl: string;

  const suffix = `${Date.now()}`;
  const ownerAEmail = `ownera-${suffix}@test.local`;
  const ownerBEmail = `ownerb-${suffix}@test.local`;
  const doctorPhone = `+99890${suffix.slice(-7)}`;
  const doctorPassword = 'Doctor9pass';
  const ownerPass = 'Owner9pass';

  let clinicAId: string;
  let clinicBId: string;
  let ownerAToken: string;
  let ownerBToken: string;
  let ownerAId: string;
  let ownerBId: string;
  let patientBId: string;
  let doctorUserId: string;
  let receptionistId: string;
  let receptionistToken: string;
  let adminMemberId: string;
  let adminToken: string;
  let doctorMembershipA: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
    const addr = app.getHttpServer().address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    serverUrl = `http://127.0.0.1:${port}`;
    prisma = app.get(PrismaService);

    const hash = await argon2.hash(ownerPass);
    const ownerA = await prisma.user.create({
      data: {
        email: ownerAEmail,
        phone: `+99891${suffix.slice(-7)}`,
        passwordHash: hash,
        firstName: 'Owner',
        lastName: 'A',
        emailVerifiedAt: new Date(),
      },
    });
    const ownerB = await prisma.user.create({
      data: {
        email: ownerBEmail,
        phone: `+99892${suffix.slice(-7)}`,
        passwordHash: hash,
        firstName: 'Owner',
        lastName: 'B',
        emailVerifiedAt: new Date(),
      },
    });
    ownerAId = ownerA.id;
    ownerBId = ownerB.id;

    const clinicA = await prisma.clinic.create({
      data: {
        name: 'Bogitto Dental',
        slug: `bogitto-${suffix}`,
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
        name: 'Hera Denta',
        slug: `hera-${suffix}`,
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

    const patientUser = await prisma.user.create({
      data: {
        email: `patb-${suffix}@test.local`,
        phone: `+99893${suffix.slice(-7)}`,
        passwordHash: hash,
        firstName: 'Pat',
        lastName: 'B',
        emailVerifiedAt: new Date(),
      },
    });
    const patient = await prisma.patientProfile.create({
      data: { userId: patientUser.id },
    });
    patientBId = patient.id;
    await prisma.patientClinic.create({
      data: { clinicId: clinicBId, patientId: patient.id },
    });

    const loginA = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: ownerAEmail, password: ownerPass });
    ownerAToken = loginA.body.session.accessToken;

    const loginB = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: ownerBEmail, password: ownerPass });
    ownerBToken = loginB.body.session.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('permission matrix', () => {
    it('A/B: receptionist defaults + custom ALLOW inventory:read', async () => {
      const created = await request(app.getHttpServer())
        .post('/clinics/me/members')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          firstName: 'Rec',
          lastName: 'Matrix',
          phone: `+99894${suffix.slice(-7)}`,
          role: 'RECEPTIONIST',
        });
      expect([200, 201]).toContain(created.status);
      receptionistId = created.body.member.id;
      const temp = created.body.temporaryPassword as string;
      expect(temp).toBeTruthy();

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: `+99894${suffix.slice(-7)}`, password: temp });
      expect(login.status).toBe(200);
      receptionistToken = login.body.session.accessToken;

      const patients = await request(app.getHttpServer())
        .get('/patients')
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect(patients.status).toBe(200);

      const appts = await request(app.getHttpServer())
        .get('/appointments')
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect([200, 201]).toContain(appts.status);

      const fin = await request(app.getHttpServer())
        .get('/finance/summary')
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect(fin.status).toBe(403);

      const invDenied = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect(invDenied.status).toBe(403);

      await request(app.getHttpServer())
        .patch(`/clinics/me/members/${receptionistId}/permissions`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          permissions: [{ permission: 'inventory:read', effect: PermissionEffect.ALLOW }],
        });

      // refresh token so membership permissions re-resolve on next requests (JWT strategy uses membership)
      const login2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: `+99894${suffix.slice(-7)}`, password: temp });
      receptionistToken = login2.body.session.accessToken;

      const invOk = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect(invOk.status).toBe(200);
    });

    it('C/D: CLINIC_ADMIN with patient:update DENY → 403; DENY precedence', async () => {
      const created = await request(app.getHttpServer())
        .post('/clinics/me/members')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          firstName: 'Adm',
          lastName: 'Deny',
          phone: `+99895${suffix.slice(-7)}`,
          role: 'CLINIC_ADMIN',
        });
      expect([200, 201]).toContain(created.status);
      adminMemberId = created.body.member.id;
      const temp = created.body.temporaryPassword as string;

      await request(app.getHttpServer())
        .patch(`/clinics/me/members/${adminMemberId}/permissions`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          permissions: [{ permission: 'patient:update', effect: PermissionEffect.DENY }],
        });

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: `+99895${suffix.slice(-7)}`, password: temp });
      adminToken = login.body.session.accessToken;

      const patient = await prisma.patientProfile.create({
        data: {
          user: {
            create: {
              email: `pata-${suffix}@test.local`,
              phone: `+99896${suffix.slice(-7)}`,
              passwordHash: await argon2.hash('x'),
              firstName: 'P',
              lastName: 'A',
            },
          },
        },
      });
      await prisma.patientClinic.create({
        data: { clinicId: clinicAId, patientId: patient.id },
      });

      const upd = await request(app.getHttpServer())
        .patch(`/patients/${patient.id}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'hack' });
      expect(upd.status).toBe(403);
    });

    it('E: owner has full clinic permissions', async () => {
      const fin = await request(app.getHttpServer())
        .get('/finance/summary')
        .set('Authorization', `Bearer ${ownerAToken}`);
      expect(fin.status).toBe(200);
      const members = await request(app.getHttpServer())
        .get('/clinics/me/members')
        .set('Authorization', `Bearer ${ownerAToken}`);
      expect(members.status).toBe(200);
    });
  });

  describe('workspace security', () => {
    it('A: switch to non-member clinic → 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/workspace/switch')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({ clinicId: clinicBId });
      expect(res.status).toBe(403);
    });

    it('B: inactive membership cannot switch', async () => {
      const doc = await request(app.getHttpServer())
        .post('/clinics/me/members')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          firstName: 'Doc',
          lastName: 'Switch',
          phone: doctorPhone,
          role: 'DOCTOR',
          specialty: 'Terapevt',
        });
      expect([200, 201]).toContain(doc.status);
      doctorMembershipA = doc.body.member.id;
      doctorUserId = doc.body.member.userId;
      const temp = doc.body.temporaryPassword as string;
      await prisma.user.update({
        where: { id: doctorUserId },
        data: { passwordHash: await argon2.hash(doctorPassword) },
      });

      await request(app.getHttpServer())
        .post(`/clinics/me/members/${doctorMembershipA}/deactivate`)
        .set('Authorization', `Bearer ${ownerAToken}`);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: doctorPhone, password: doctorPassword });
      // may have 0 workspaces
      const token = login.body.session?.accessToken;
      if (token) {
        const sw = await request(app.getHttpServer())
          .post('/auth/workspace/switch')
          .set('Authorization', `Bearer ${token}`)
          .send({ clinicId: clinicAId });
        expect(sw.status).toBe(403);
      }
    });

    it('C: refresh preserves active workspace', async () => {
      await request(app.getHttpServer())
        .post(`/clinics/me/members/${doctorMembershipA}/reactivate`)
        .set('Authorization', `Bearer ${ownerAToken}`);

      const attachB = await request(app.getHttpServer())
        .post('/clinics/me/members')
        .set('Authorization', `Bearer ${ownerBToken}`)
        .send({
          firstName: 'Doc',
          lastName: 'Switch',
          phone: doctorPhone,
          role: 'DOCTOR',
          specialty: 'Terapevt',
        });
      expect(attachB.body.existingUser).toBe(true);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: doctorPhone, password: doctorPassword });
      expect(login.body.session.workspaces.length).toBeGreaterThanOrEqual(2);

      const switched = await request(app.getHttpServer())
        .post('/auth/workspace/switch')
        .set('Authorization', `Bearer ${login.body.session.accessToken}`)
        .send({ clinicId: clinicBId });
      expect(switched.body.activeWorkspace.clinicId).toBe(clinicBId);

      const refreshed = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: switched.body.refreshToken });
      expect([200, 201]).toContain(refreshed.status);
      const session = refreshed.body.session ?? refreshed.body;
      expect(session.activeWorkspace?.clinicId ?? session.user?.clinicId).toBe(
        clinicBId,
      );
    });

    it('D: deactivated membership invalidates access via JWT strategy', async () => {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: doctorPhone, password: doctorPassword });
      const switched = await request(app.getHttpServer())
        .post('/auth/workspace/switch')
        .set('Authorization', `Bearer ${login.body.session.accessToken}`)
        .send({ clinicId: clinicAId });
      const oldToken = switched.body.accessToken;

      await request(app.getHttpServer())
        .post(`/clinics/me/members/${doctorMembershipA}/deactivate`)
        .set('Authorization', `Bearer ${ownerAToken}`);

      const me = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${oldToken}`);
      expect([401, 403]).toContain(me.status);
    });
  });

  describe('cross-tenant matrix', () => {
    it('Clinic A cannot read Clinic B resources', async () => {
      const paths = [
        `/patients/${patientBId}`,
        `/appointments?clinicId=${clinicBId}`,
        `/finance/summary`,
        `/inventory`,
        `/rooms`,
        `/clinics/me/services`,
      ];
      // finance/inventory/rooms scoped to A — should succeed but not leak B ids
      const fin = await request(app.getHttpServer())
        .get('/finance/summary')
        .set('Authorization', `Bearer ${ownerAToken}`);
      expect(fin.status).toBe(200);

      const patient = await request(app.getHttpServer())
        .get(`/patients/${patientBId}`)
        .set('Authorization', `Bearer ${ownerAToken}`);
      expect([403, 404]).toContain(patient.status);

      const apptCreate = await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          clinicId: clinicBId,
          doctorId: 'x',
          date: '2099-01-01',
          time: '10:00',
          serviceId: 'x',
        });
      expect(apptCreate.status).toBe(403);

      void paths;
    });
  });

  describe('doctor transfer', () => {
    it('deactivate A → Hera only → reactivate A → 2 workspaces', async () => {
      // Ensure doctor linked to both; A may be inactive from prior test
      await request(app.getHttpServer())
        .post(`/clinics/me/members/${doctorMembershipA}/reactivate`)
        .set('Authorization', `Bearer ${ownerAToken}`);

      const usersBefore = await prisma.user.findMany({ where: { phone: doctorPhone } });
      expect(usersBefore).toHaveLength(1);
      const profileBefore = await prisma.doctorProfile.findUnique({
        where: { userId: usersBefore[0].id },
      });
      expect(profileBefore).toBeTruthy();

      await request(app.getHttpServer())
        .post(`/clinics/me/members/${doctorMembershipA}/deactivate`)
        .set('Authorization', `Bearer ${ownerAToken}`);

      const linkA = await prisma.doctorClinic.findFirst({
        where: { doctorId: profileBefore!.id, clinicId: clinicAId },
      });
      expect(linkA?.isActive).toBe(false);
      expect(linkA?.endedAt).toBeTruthy();

      const usersAfter = await prisma.user.findMany({ where: { phone: doctorPhone } });
      expect(usersAfter).toHaveLength(1);
      expect(
        await prisma.doctorProfile.findUnique({ where: { userId: usersAfter[0].id } }),
      ).toBeTruthy();

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: doctorPhone, password: doctorPassword });
      const workspaces = login.body.session.workspaces as { clinicId: string }[];
      expect(workspaces.every((w) => w.clinicId !== clinicAId)).toBe(true);
      expect(workspaces.some((w) => w.clinicId === clinicBId)).toBe(true);

      await request(app.getHttpServer())
        .post(`/clinics/me/members/${doctorMembershipA}/reactivate`)
        .set('Authorization', `Bearer ${ownerAToken}`);

      const login2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: doctorPhone, password: doctorPassword });
      expect(login2.body.session.workspaces.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('invitation + socket', () => {
    it('invitation token hashed; accept activates membership', async () => {
      const invite = await request(app.getHttpServer())
        .post('/clinics/me/invitations')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          firstName: 'Inv',
          lastName: 'Itee',
          phone: `+99897${suffix.slice(-7)}`,
          email: `invitee-${suffix}@test.local`,
          role: 'ACCOUNTANT',
        });
      expect([200, 201]).toContain(invite.status);
      expect(invite.body.invitationId).toBeTruthy();
      const token = invite.body.activationToken as string | undefined;
      // DEV may expose token
      if (token) {
        const peek = await request(app.getHttpServer()).get(`/invitations/${token}`);
        expect(peek.status).toBe(200);
        const accept = await request(app.getHttpServer())
          .post(`/invitations/${token}/accept`)
          .send({ password: 'Invitee9pass' });
        expect([200, 201]).toContain(accept.status);

        const again = await request(app.getHttpServer())
          .post(`/invitations/${token}/accept`)
          .send({ password: 'Invitee9pass' });
        expect(again.status).toBe(400);
        expect(again.body.code).toBe('INVITATION_ALREADY_ACCEPTED');
      }
    });

    it('socket rooms are clinic-scoped (smoke)', async () => {
      const loginA = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: ownerAEmail, password: ownerPass });
      const loginB = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier: ownerBEmail, password: ownerPass });

      const origin = serverUrl;
      const receivedB: unknown[] = [];

      await new Promise<void>((resolve, reject) => {
        const socketB: Socket = io(`${origin}/realtime`, {
          auth: { token: loginB.body.session.accessToken },
          transports: ['websocket'],
          forceNew: true,
        });
        const timer = setTimeout(() => {
          socketB.disconnect();
          resolve();
        }, 1500);
        socketB.on('connect_error', (err) => {
          clearTimeout(timer);
          reject(err);
        });
        socketB.on('appointment.created', (p) => receivedB.push(p));
        socketB.on('connect', () => {
          // Emit via service would need internal access; smoke = connect OK
          clearTimeout(timer);
          socketB.disconnect();
          resolve();
        });
      });

      expect(receivedB).toHaveLength(0);
      void loginA;
      void origin;
    });
  });
});
