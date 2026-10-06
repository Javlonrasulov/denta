import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DoctorFinanceJobs } from '../src/doctor-finance/doctor-finance.jobs';
import { DoctorFinanceService } from '../src/doctor-finance/doctor-finance.service';

/**
 * Doctor financial agreements / rent / debt — scenarios A–O.
 * Requires local Postgres. Creates isolated fixtures (unique suffix); finance rows are
 * never hard-deleted by design, so fixtures stay in the dev database.
 */
jest.setTimeout(180_000);

/** Instant for a Tashkent wall-clock time (UTC+5, no DST). */
const at = (ymd: string, hh = 10) => new Date(`${ymd}T${String(hh - 5).padStart(2, '0')}:00:00.000Z`);

describe('Doctor finance (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let svc: DoctorFinanceService;
  let jobs: DoctorFinanceJobs;
  const suffix = Date.now();
  const tokens: Record<string, string> = {};
  let clinicA: string;
  let clinicB: string;
  let ownerA: string;
  const doctors: Record<string, { id: string; userId: string; linkA: string }> = {};

  const http = () => request(app.getHttpServer());

  let userSeq = 0;
  async function makeUser(tag: string, role?: UserRole, clinicId?: string) {
    const passwordHash = await argon2.hash('Test1234');
    const n = ++userSeq;
    const user = await prisma.user.create({
      data: {
        email: `dfin-${tag.toLowerCase()}-${suffix}@test.local`,
        phone: `+9989${String(suffix + n).slice(-8)}`,
        passwordHash,
        firstName: tag,
        lastName: 'Test',
        emailVerifiedAt: new Date(),
      },
    });
    if (role && clinicId) {
      await prisma.userRoleAssignment.create({ data: { userId: user.id, role, clinicId } });
      await prisma.clinicMember.create({ data: { clinicId, userId: user.id, role, joinedAt: new Date() } });
    }
    return user;
  }

  async function makeClinic(tag: string) {
    const clinic = await prisma.clinic.create({
      data: {
        name: `DFin ${tag} ${suffix}`,
        slug: `dfin-${tag}-${suffix}`,
        accountStatus: 'ACTIVE',
        timezone: 'Asia/Tashkent',
      },
    });
    await prisma.subscription.create({
      data: { clinicId: clinic.id, status: 'ACTIVE', subscriptionStartedAt: new Date() },
    });
    return clinic.id;
  }

  async function makeDoctor(tag: string, clinicId: string, member = false) {
    const user = await makeUser(tag, member ? UserRole.DOCTOR : undefined, member ? clinicId : undefined);
    const profile = await prisma.doctorProfile.create({ data: { userId: user.id, specialty: 'Terapevt' } });
    const link = await prisma.doctorClinic.create({ data: { doctorId: profile.id, clinicId } });
    for (const day of [1, 2, 3, 4, 5]) {
      await prisma.doctorSchedule.create({
        data: { doctorId: profile.id, doctorClinicId: link.id, dayOfWeek: day, startTime: '09:00', endTime: '18:00' },
      });
    }
    doctors[tag] = { id: profile.id, userId: user.id, linkA: link.id };
    return doctors[tag];
  }

  async function login(email: string) {
    const res = await http().post('/api/v1/auth/login').send({ identifier: email, password: 'Test1234' });
    if (res.status !== 200) throw new Error(`login ${email}: ${res.status} ${JSON.stringify(res.body)}`);
    return res.body.session.accessToken as string;
  }

  const monthly = (amount: number, from = '2026-10-01', day = 5) => ({
    model: 'DOCTOR_REVENUE_PLUS_RENT' as const,
    effectiveFrom: from,
    rent: { amountUzs: amount, recurrence: 'MONTHLY' as const, dueDayOfMonth: day },
  });

  const obligationsOf = (linkId: string) =>
    prisma.doctorRentObligation.findMany({ where: { doctorClinicId: linkId }, orderBy: { dueDate: 'asc' } });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = new PrismaClient();
    await prisma.$connect();
    svc = app.get(DoctorFinanceService);
    jobs = app.get(DoctorFinanceJobs);

    clinicA = await makeClinic('a');
    clinicB = await makeClinic('b');
    const oA = await makeUser('ownerA', UserRole.CLINIC_OWNER, clinicA);
    ownerA = oA.id;
    const oB = await makeUser('ownerB', UserRole.CLINIC_OWNER, clinicB);
    const acc = await makeUser('accountant', UserRole.ACCOUNTANT, clinicA);
    const adm = await makeUser('admin', UserRole.CLINIC_ADMIN, clinicA);
    const rec = await makeUser('reception', UserRole.RECEPTIONIST, clinicA);
    await makeDoctor('d1', clinicA, true);
    for (const t of ['d2', 'd3', 'd4', 'd5']) await makeDoctor(t, clinicA);

    tokens.ownerA = await login(oA.email!);
    tokens.ownerB = await login(oB.email!);
    tokens.accountant = await login(acc.email!);
    tokens.admin = await login(adm.email!);
    tokens.reception = await login(rec.email!);
    tokens.d1 = await login(`dfin-d1-${suffix}@test.local`);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('A) monthly agreement creates the period obligation (UPCOMING before due)', async () => {
    const d = await svc.saveAgreement(clinicA, ownerA, doctors.d1.id, monthly(3_000_000), at('2026-10-01'));
    expect(d.configured).toBe(true);
    const obs = await obligationsOf(doctors.d1.linkA);
    expect(obs.map((o) => o.dueDate.toISOString().slice(0, 10))).toEqual(['2026-10-05', '2026-11-05']);
    expect(obs[0].amountUzs).toBe(3_000_000);
    expect(obs[0].status).toBe('UPCOMING');
  });

  it('B) partial payment → PARTIALLY_PAID with correct remainder', async () => {
    const d = await svc.recordPayment(clinicA, ownerA, doctors.d1.id, { amountUzs: 1_000_000, method: 'cash' }, at('2026-10-03'));
    const oct = d.obligations.find((o) => o.dueDate === '2026-10-05')!;
    expect(oct.status).toBe('PARTIALLY_PAID');
    expect(oct.outstandingUzs).toBe(2_000_000);
  });

  it('C) remaining payment → PAID', async () => {
    const d = await svc.recordPayment(clinicA, ownerA, doctors.d1.id, { amountUzs: 2_000_000, method: 'card' }, at('2026-10-04'));
    expect(d.obligations.find((o) => o.dueDate === '2026-10-05')!.status).toBe('PAID');
    expect(d.summary.totalDebtUzs).toBe(0);
  });

  it('D) unpaid obligation past due → OVERDUE and counted as debt', async () => {
    const d = await svc.detail(clinicA, doctors.d1.id, at('2026-11-07'));
    const nov = d.obligations.find((o) => o.dueDate === '2026-11-05')!;
    expect(nov.status).toBe('OVERDUE');
    expect(nov.daysOverdue).toBe(2);
    expect(d.summary.overdueUzs).toBe(3_000_000);
    expect(d.summary.totalDebtUzs).toBe(3_000_000);
    expect(d.summary.aging.d0_7).toBe(3_000_000);
  });

  it('E) overpayment becomes an advance and auto-applies to the next period', async () => {
    let d = await svc.recordPayment(clinicA, ownerA, doctors.d1.id, { amountUzs: 7_000_000, method: 'transfer' }, at('2026-11-07'));
    expect(d.obligations.find((o) => o.dueDate === '2026-11-05')!.status).toBe('PAID');
    expect(d.obligations.find((o) => o.dueDate === '2026-12-05')!.status).toBe('PAID');
    expect(d.summary.advanceUzs).toBe(1_000_000);
    d = await svc.detail(clinicA, doctors.d1.id, at('2027-01-02'));
    const jan = d.obligations.find((o) => o.dueDate === '2027-01-05')!;
    expect(jan.paidUzs).toBe(1_000_000);
    expect(jan.status).toBe('PARTIALLY_PAID');
    expect(d.summary.advanceUzs).toBe(0);
  });

  it('F/G) inactive doctor: no new obligations, old debt kept', async () => {
    await svc.saveAgreement(clinicA, ownerA, doctors.d2.id, monthly(3_000_000), at('2026-10-01'));
    await prisma.doctorClinic.update({
      where: { id: doctors.d2.linkA },
      data: { isActive: false, endedAt: at('2026-10-20') },
    });
    const d = await svc.detail(clinicA, doctors.d2.id, at('2026-12-10'));
    const live = d.obligations.filter((o) => o.status !== 'CANCELLED');
    expect(live.map((o) => o.dueDate)).toEqual(['2026-10-05']);
    expect(d.obligations.find((o) => o.dueDate === '2026-11-05')!.status).toBe('CANCELLED');
    expect(d.obligations.some((o) => o.dueDate === '2026-12-05')).toBe(false);
    expect(d.summary.totalDebtUzs).toBe(3_000_000);
    expect(d.history[0].status).toBe('ENDED');
  });

  it('H) agreement change keeps old obligations and bills the new terms from effectiveFrom', async () => {
    const v1 = await svc.saveAgreement(clinicA, ownerA, doctors.d3.id, monthly(2_000_000), at('2026-10-01'));
    const v1Id = v1.agreement!.id;
    await svc.recordPayment(clinicA, ownerA, doctors.d3.id, { amountUzs: 2_000_000, method: 'cash' }, at('2026-10-02'));
    const v2 = await svc.saveAgreement(clinicA, ownerA, doctors.d3.id, monthly(4_000_000, '2026-11-01'), at('2026-10-10'));
    expect(v2.agreement!.version).toBe(2);
    expect(v2.history.find((h) => h.version === 1)!.status).toBe('SUPERSEDED');
    const obs = await obligationsOf(doctors.d3.linkA);
    const oct = obs.find((o) => o.dueDate.toISOString().startsWith('2026-10-05'))!;
    expect(oct.agreementId).toBe(v1Id);
    expect(oct.amountUzs).toBe(2_000_000);
    expect(oct.status).toBe('PAID');
    const nov = obs.filter((o) => o.dueDate.toISOString().startsWith('2026-11-05'));
    expect(nov.find((o) => o.agreementId === v1Id)!.status).toBe('CANCELLED');
    expect(nov.find((o) => o.agreementId === v2.agreement!.id)!.amountUzs).toBe(4_000_000);
  });

  it('I) multi-clinic: agreements and debts are isolated per DoctorClinic', async () => {
    const linkB = await prisma.doctorClinic.create({ data: { doctorId: doctors.d1.id, clinicId: clinicB } });
    const ownerBUser = await prisma.clinicMember.findFirstOrThrow({ where: { clinicId: clinicB, role: 'CLINIC_OWNER' } });
    const b = await svc.saveAgreement(
      clinicB,
      ownerBUser.userId,
      doctors.d1.id,
      { model: 'REVENUE_SHARE', effectiveFrom: '2026-10-01', clinicPercent: 50 },
      at('2026-10-01'),
    );
    expect(b.doctor.doctorClinicId).toBe(linkB.id);
    expect(b.obligations).toHaveLength(0);
    const a = await svc.detail(clinicA, doctors.d1.id, at('2026-11-07'));
    expect(a.agreement!.model).toBe('DOCTOR_REVENUE_PLUS_RENT');
    expect(a.doctor.doctorClinicId).toBe(doctors.d1.linkA);
    expect(await prisma.doctorRentObligation.count({ where: { doctorClinicId: linkB.id } })).toBe(0);
  });

  it('J) revenue share 70/30 counts only real (PAID) payments', async () => {
    await svc.saveAgreement(clinicA, ownerA, doctors.d4.id, {
      model: 'REVENUE_SHARE',
      effectiveFrom: '2026-10-01',
      clinicPercent: 30,
    });
    const pending = await http()
      .post('/api/v1/finance')
      .set('Authorization', `Bearer ${tokens.ownerA}`)
      .send({ type: 'income', amount: 600_000, doctorId: doctors.d4.id, serviceName: 'Plomba', paymentStatus: 'pending' })
      .expect(201);
    expect(await prisma.doctorRevenueShareEntry.count({ where: { paymentId: pending.body.id } })).toBe(0);

    const paid = await http()
      .post('/api/v1/finance')
      .set('Authorization', `Bearer ${tokens.ownerA}`)
      .send({ type: 'income', amount: 600_000, doctorId: doctors.d4.id, serviceName: 'Plomba', paymentStatus: 'paid' })
      .expect(201);
    const [entry] = await prisma.doctorRevenueShareEntry.findMany({ where: { paymentId: paid.body.id } });
    expect(entry.doctorShareUzs).toBe(420_000);
    expect(entry.clinicShareUzs).toBe(180_000);
    (globalThis as Record<string, unknown>).__paidId = paid.body.id;
    (globalThis as Record<string, unknown>).__pendingId = pending.body.id;
  });

  it('K) refund and cancellation reverse the doctor share (append-only)', async () => {
    const paidId = (globalThis as Record<string, unknown>).__paidId as string;
    const pendingId = (globalThis as Record<string, unknown>).__pendingId as string;
    const refund = await http()
      .post(`/api/v1/finance/payments/${paidId}/refund`)
      .set('Authorization', `Bearer ${tokens.ownerA}`)
      .send({ amount: 200_000, reason: 'Bemor qaytardi' })
      .expect(201);
    expect(refund.body.amount).toBe(-200_000);
    await http()
      .post(`/api/v1/finance/payments/${paidId}/refund`)
      .set('Authorization', `Bearer ${tokens.ownerA}`)
      .send({ amount: 500_000, reason: 'Ortiqcha' })
      .expect(400);

    await http()
      .patch(`/api/v1/finance/${pendingId}`)
      .set('Authorization', `Bearer ${tokens.ownerA}`)
      .send({ paymentStatus: 'paid' })
      .expect(200);
    await http()
      .patch(`/api/v1/finance/${pendingId}`)
      .set('Authorization', `Bearer ${tokens.ownerA}`)
      .send({ paymentStatus: 'cancelled' })
      .expect(200);
    const pendingEntries = await prisma.doctorRevenueShareEntry.findMany({ where: { paymentId: pendingId } });
    expect(pendingEntries.map((e) => e.kind)).toEqual(['ACCRUAL', 'REVERSAL']);
    expect(pendingEntries.reduce((s, e) => s + e.doctorShareUzs, 0)).toBe(0);

    const d = await svc.detail(clinicA, doctors.d4.id);
    expect(d.revenueShare.allTime.doctorShareUzs).toBe(420_000 - 140_000);
    expect(d.revenueShare.allTime.collectedUzs).toBe(400_000);
  });

  it('L) generation is idempotent (no duplicate obligations, even concurrently)', async () => {
    const before = await prisma.doctorRentObligation.count({ where: { doctorClinicId: doctors.d1.linkA } });
    await Promise.all([1, 2, 3, 4, 5].map(() => svc.syncLink(doctors.d1.linkA, at('2027-01-02'))));
    await jobs.syncAll(at('2027-01-02'));
    const after = await prisma.doctorRentObligation.count({ where: { doctorClinicId: doctors.d1.linkA } });
    expect(after).toBe(before);
    const keys = await prisma.doctorRentObligation.groupBy({
      by: ['periodKey'],
      where: { doctorClinicId: doctors.d1.linkA },
      _count: true,
    });
    expect(keys.every((k) => k._count === 1)).toBe(true);
  });

  it('M) reminders are sent once per stage (dedupe)', async () => {
    await svc.saveAgreement(clinicA, ownerA, doctors.d5.id, monthly(1_500_000), at('2026-10-01'));
    const due = await prisma.doctorRentObligation.findFirstOrThrow({
      where: { doctorClinicId: doctors.d5.linkA, dueDate: new Date('2026-10-05T00:00:00Z') },
    });
    const early = await jobs.runReminders(at('2026-10-05', 7));
    expect(await prisma.doctorRentReminderLog.count({ where: { obligationId: due.id } })).toBe(0);
    void early;

    await jobs.runReminders(at('2026-10-05', 11));
    const logs1 = await prisma.doctorRentReminderLog.count({ where: { obligationId: due.id } });
    const notes1 = await prisma.notification.count({ where: { userId: doctors.d5.userId, type: 'DOCTOR_RENT_REMINDER' } });
    expect(logs1).toBeGreaterThanOrEqual(2);
    expect(notes1).toBe(1);

    await jobs.runReminders(at('2026-10-05', 15));
    expect(await prisma.doctorRentReminderLog.count({ where: { obligationId: due.id } })).toBe(logs1);
    expect(
      await prisma.notification.count({ where: { userId: doctors.d5.userId, type: 'DOCTOR_RENT_REMINDER' } }),
    ).toBe(1);

    await jobs.runReminders(at('2026-10-06', 11));
    expect(
      await prisma.notification.count({ where: { userId: doctors.d5.userId, type: 'DOCTOR_RENT_REMINDER' } }),
    ).toBe(2);
  });

  it('N) permissions: owner/accountant/admin/receptionist/doctor', async () => {
    const base = '/api/v1/clinics/me/doctor-finance';
    await http().get(`${base}/overview`).set('Authorization', `Bearer ${tokens.ownerA}`).expect(200);
    await http().get(`${base}/overview`).set('Authorization', `Bearer ${tokens.accountant}`).expect(200);
    await http().get(`${base}/overview`).set('Authorization', `Bearer ${tokens.admin}`).expect(200);
    await http().get(`${base}/overview`).set('Authorization', `Bearer ${tokens.reception}`).expect(403);
    await http().get(`${base}/overview`).set('Authorization', `Bearer ${tokens.d1}`).expect(403);

    await http()
      .post(`${base}/doctors/${doctors.d5.id}/payments`)
      .set('Authorization', `Bearer ${tokens.accountant}`)
      .send({ amountUzs: 100_000, method: 'cash' })
      .expect(201);
    await http()
      .post(`${base}/doctors/${doctors.d5.id}/payments`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ amountUzs: 100_000, method: 'cash' })
      .expect(403);
    await http()
      .post(`${base}/doctors/${doctors.d5.id}/agreements`)
      .set('Authorization', `Bearer ${tokens.accountant}`)
      .send(monthly(1_000_000))
      .expect(403);

    const mine = await http().get('/api/v1/doctors/me/clinic-finance').set('Authorization', `Bearer ${tokens.d1}`).expect(200);
    expect(mine.body.doctor.doctorId).toBe(doctors.d1.id);
    expect(mine.body.history).toBeUndefined();
    expect(mine.body.payments.every((p: { createdBy?: string }) => p.createdBy === undefined)).toBe(true);
    await http().get('/api/v1/doctors/me/clinic-finance').set('Authorization', `Bearer ${tokens.accountant}`).expect(403);
  });

  it('O) cross-clinic access is rejected; clinicId from the client is ignored', async () => {
    const base = '/api/v1/clinics/me/doctor-finance';
    await http().get(`${base}/doctors/${doctors.d2.id}`).set('Authorization', `Bearer ${tokens.ownerB}`).expect(404);
    const payment = await prisma.doctorRentPayment.findFirstOrThrow({ where: { doctorClinicId: doctors.d1.linkA } });
    await http()
      .post(`${base}/doctors/${doctors.d1.id}/payments/${payment.id}/void`)
      .set('Authorization', `Bearer ${tokens.ownerB}`)
      .send({ reason: 'hack attempt' })
      .expect(404);
    const ob = await http()
      .get(`${base}/overview?clinicId=${clinicA}`)
      .set('Authorization', `Bearer ${tokens.ownerB}`)
      .expect(200);
    expect(ob.body.rows.every((r: { doctorId: string }) => r.doctorId === doctors.d1.id)).toBe(true);
    expect(ob.body.metrics.totalDebtUzs).toBe(0);
  });

  it('P) add-doctor flow saves the agreement in the same request; invalid or unauthorized agreements create nothing', async () => {
    const phone = (n: number) => `+9989${String(suffix + 500 + n).slice(-8)}`;
    const body = (n: number, agreement: unknown) => ({
      firstName: `Wizard${n}`,
      lastName: 'Test',
      phone: phone(n),
      specialties: ['Terapevt'],
      agreement,
    });

    const created = await http()
      .post('/api/v1/clinics/me/doctors')
      .set('Authorization', `Bearer ${tokens.ownerA}`)
      .send(body(1, monthly(2_500_000, '2026-10-01', 10)))
      .expect(201);
    expect(created.body.agreementSaved).toBe(true);
    expect(typeof created.body.doctorId).toBe('string');
    const d = await svc.detail(clinicA, created.body.doctorId);
    expect(d.configured).toBe(true);
    expect(d.agreement?.rent?.amountUzs).toBe(2_500_000);

    await http()
      .post('/api/v1/clinics/me/doctors')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send(body(2, monthly(1_000_000)))
      .expect(403);
    const bad = await http()
      .post('/api/v1/clinics/me/doctors')
      .set('Authorization', `Bearer ${tokens.ownerA}`)
      .send(body(3, { ...monthly(1_000_000), rent: { amountUzs: 1_000_000, recurrence: 'MONTHLY' } }))
      .expect(400);
    expect(bad.body.code).toBe('VALIDATION_ERROR');
    const futureOpening = await http()
      .post('/api/v1/clinics/me/doctors')
      .set('Authorization', `Bearer ${tokens.ownerA}`)
      .send(body(4, { ...monthly(1_000_000), openingBalance: { amountUzs: 500_000, asOf: '2099-01-01' } }))
      .expect(400);
    expect(futureOpening.body.code).toBe('VALIDATION_ERROR');
    for (const n of [2, 3, 4]) {
      expect(await prisma.user.count({ where: { phone: phone(n) } })).toBe(0);
    }
  });

  it('Q) review is race-safe, receipts must be our own upload, refunded payments cannot shrink', async () => {
    const submitted = await svc.submitMyPayment(doctors.d1.userId, clinicA, { amountUzs: 50_000, method: 'cash' });
    const sp = submitted.payments.find((p) => p.status === 'SUBMITTED')!;
    const results = await Promise.allSettled([
      svc.reviewSubmission(clinicA, ownerA, doctors.d1.id, sp.id, 'confirm'),
      svc.reviewSubmission(clinicA, ownerA, doctors.d1.id, sp.id, 'reject', 'duplicate'),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const row = await prisma.doctorRentPayment.findUniqueOrThrow({ where: { id: sp.id } });
    const live = await prisma.doctorRentAllocation.count({ where: { paymentId: sp.id, reversedAt: null } });
    if (row.status === 'REJECTED') expect(live).toBe(0);

    const base = '/api/v1/clinics/me/doctor-finance';
    for (const url of [
      `/files/private/${clinicA}/doctor-rent/../../${clinicB}/x.pdf`,
      `/files/private/${clinicB}/doctor-rent/0b6f0a43-5f53-4f0e-9a4f-1d1b7a3c9e11.pdf`,
    ]) {
      await http()
        .post(`${base}/doctors/${doctors.d5.id}/payments`)
        .set('Authorization', `Bearer ${tokens.ownerA}`)
        .send({ amountUzs: 10_000, method: 'cash', attachmentUrl: url })
        .expect(400);
    }

    const paidId = (globalThis as Record<string, unknown>).__paidId as string;
    for (const patch of [{ amount: 100_000 }, { paymentStatus: 'cancelled' }]) {
      await http()
        .patch(`/api/v1/finance/${paidId}`)
        .set('Authorization', `Bearer ${tokens.ownerA}`)
        .send(patch)
        .expect(400);
    }
  });

  it('R) report keeps departed doctors who had activity in the range', async () => {
    await svc.recordPayment(clinicA, ownerA, doctors.d2.id, { amountUzs: 3_000_000, method: 'cash' }, at('2026-12-10'));
    const report = await svc.report(clinicA, { from: '2026-10-01', to: '2026-12-31' }, at('2026-12-10'));
    const row = report.rows.find((r) => r.doctorId === doctors.d2.id)!;
    expect(row).toBeDefined();
    expect(row.isActive).toBe(false);
    expect(row.debtUzs).toBe(0);
    expect(row.accruedUzs).toBe(3_000_000);
    expect(row.paidUzs).toBe(3_000_000);
  });

  it('Audit + no hard delete: void keeps the row and logs who/when', async () => {
    const d = await svc.detail(clinicA, doctors.d5.id);
    const p = d.payments.find((x) => x.status === 'CONFIRMED')!;
    const after = await svc.voidPayment(clinicA, ownerA, doctors.d5.id, p.id, 'Xato kiritilgan');
    const voided = after.payments.find((x) => x.id === p.id)!;
    expect(voided.status).toBe('VOIDED');
    expect(voided.voidReason).toBe('Xato kiritilgan');
    const logs = await prisma.auditLog.findMany({
      where: { clinicId: clinicA, entityId: p.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(logs.map((l) => l.action)).toEqual(['doctor_finance.payment.created', 'doctor_finance.payment.voided']);
    expect(await prisma.doctorRentAllocation.count({ where: { paymentId: p.id, reversedAt: null } })).toBe(0);
  });
});
