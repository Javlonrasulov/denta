/**
 * Development seed — NEVER runs in production.
 * npm run prisma:seed -w @denta/api
 */
import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

async function ensureRole(
  userId: string,
  role: UserRole,
  clinicId?: string,
) {
  const existing = await prisma.userRoleAssignment.findFirst({
    where: { userId, role, clinicId: clinicId ?? null },
  });
  if (!existing) {
    await prisma.userRoleAssignment.create({
      data: { userId, role, clinicId },
    });
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed in production');
    process.exit(1);
  }

  const passwordHash = await argon2.hash('Demo1234');

  const owner = await prisma.user.upsert({
    where: { email: 'clinic@denta.local' },
    update: { passwordHash, emailVerifiedAt: new Date() },
    create: {
      email: 'clinic@denta.local',
      phone: '+998901000001',
      passwordHash,
      firstName: 'Nodira',
      lastName: 'Karimova',
      emailVerifiedAt: new Date(),
      locale: 'uz',
    },
  });

  const clinic = await prisma.clinic.upsert({
    where: { slug: 'smile-dental-tashkent' },
    update: {
      isMarketplaceVisible: true,
      bookingEnabled: true,
      accountStatus: 'ACTIVE',
      about:
        'Zamonaviy stomatologiya klinikasi — implantologiya, ortodontiya va bolalar stomatologiyasi.',
    },
    create: {
      name: 'Smile Dental Clinic',
      slug: 'smile-dental-tashkent',
      phone: '+998712000001',
      email: 'clinic@denta.local',
      about:
        'Zamonaviy stomatologiya klinikasi — implantologiya, ortodontiya va bolalar stomatologiyasi.',
      specializations: ['implantologiya', 'ortodontiya', 'terapevtik'],
      accountStatus: 'ACTIVE',
      isMarketplaceVisible: true,
      bookingEnabled: true,
      onboardingCompleted: true,
      onboardingStep: 6,
      priceFromUzs: 150_000,
      ratingAvg: 4.8,
      reviewCount: 42,
    },
  });

  await prisma.clinicMember.upsert({
    where: { clinicId_userId: { clinicId: clinic.id, userId: owner.id } },
    update: {},
    create: {
      clinicId: clinic.id,
      userId: owner.id,
      role: UserRole.CLINIC_OWNER,
      joinedAt: new Date(),
    },
  });
  await ensureRole(owner.id, UserRole.CLINIC_OWNER, clinic.id);

  await prisma.subscription.upsert({
    where: { clinicId: clinic.id },
    update: {
      status: 'TRIAL',
      trialEndsAt: addDays(new Date(), 30),
      marketplaceBookingEnabled: true,
    },
    create: {
      clinicId: clinic.id,
      status: 'TRIAL',
      trialStartedAt: new Date(),
      trialEndsAt: addDays(new Date(), 30),
      marketplaceBookingEnabled: true,
    },
  });

  let branch = await prisma.clinicBranch.findFirst({
    where: { clinicId: clinic.id, isPrimary: true },
  });
  if (!branch) {
    branch = await prisma.clinicBranch.create({
      data: {
        clinicId: clinic.id,
        name: 'Yunusobod filiali',
        address: 'Yunusobod, 12-mavze',
        city: 'Toshkent',
        region: 'Toshkent',
        latitude: 41.3675,
        longitude: 69.2875,
        phone: '+998712000001',
        isPrimary: true,
        workingHours: [1, 2, 3, 4, 5, 6].map((day) => ({
          day,
          open: '09:00',
          close: '18:00',
        })),
      },
    });
  }

  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@denta.local' },
    update: { passwordHash, emailVerifiedAt: new Date() },
    create: {
      email: 'doctor@denta.local',
      phone: '+998901000002',
      passwordHash,
      firstName: 'Alisher',
      lastName: 'Aliyev',
      emailVerifiedAt: new Date(),
    },
  });

  const doctor = await prisma.doctorProfile.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      specialty: 'Terapevt stomatolog',
      experienceYears: 12,
      bio: '12 yillik tajribaga ega stomatolog.',
      appointmentDurationMinutes: 30,
      priceFromUzs: 200_000,
      ratingAvg: 4.9,
      reviewCount: 128,
      gender: 'MALE',
      languages: ['uz', 'ru'],
      isActive: true,
    },
  });

  await ensureRole(doctorUser.id, UserRole.DOCTOR, clinic.id);
  await prisma.clinicMember.upsert({
    where: {
      clinicId_userId: { clinicId: clinic.id, userId: doctorUser.id },
    },
    update: {},
    create: {
      clinicId: clinic.id,
      userId: doctorUser.id,
      role: UserRole.DOCTOR,
      joinedAt: new Date(),
    },
  });

  const existingLink = await prisma.doctorClinic.findFirst({
    where: { doctorId: doctor.id, clinicId: clinic.id },
  });
  if (!existingLink) {
    await prisma.doctorClinic.create({
      data: {
        doctorId: doctor.id,
        clinicId: clinic.id,
        branchId: branch.id,
        isActive: true,
      },
    });
  }

  for (let day = 1; day <= 6; day++) {
    await prisma.doctorSchedule.upsert({
      where: {
        doctorId_dayOfWeek: { doctorId: doctor.id, dayOfWeek: day },
      },
      create: {
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '13:00',
        breakEnd: '14:00',
        slotDuration: 30,
      },
      update: {},
    });
  }

  let service = await prisma.service.findFirst({
    where: { nameKey: 'service.consultation' },
  });
  if (!service) {
    service = await prisma.service.findFirst({
      where: { name: 'Konsultatsiya' },
    });
  }

  const catalogTemplates = [
    {
      nameKey: 'service.consultation',
      category: 'general',
      defaultDuration: 30,
      defaultPriceUzs: 150_000,
      translations: {
        uz: 'Konsultatsiya',
        'uz-Cyrl': 'Консультация',
        ru: 'Консультация',
        en: 'Consultation',
      },
    },
    {
      nameKey: 'service.professional_cleaning',
      category: 'hygiene',
      defaultDuration: 45,
      defaultPriceUzs: 350_000,
      translations: {
        uz: 'Professional tozalash',
        'uz-Cyrl': 'Профессионал тозалаш',
        ru: 'Профессиональная чистка',
        en: 'Professional cleaning',
      },
    },
    {
      nameKey: 'service.filling',
      category: 'therapy',
      defaultDuration: 60,
      defaultPriceUzs: 450_000,
      translations: {
        uz: 'Kariyes davolash / Plomba',
        'uz-Cyrl': 'Кариес даволаш / Пломба',
        ru: 'Лечение кариеса / Пломба',
        en: 'Caries treatment / Filling',
      },
    },
    {
      nameKey: 'service.root_canal',
      category: 'endodontics',
      defaultDuration: 90,
      defaultPriceUzs: 800_000,
      translations: {
        uz: 'Kanal davolash',
        'uz-Cyrl': 'Канал даволаш',
        ru: 'Лечение каналов',
        en: 'Root canal treatment',
      },
    },
    {
      nameKey: 'service.whitening',
      category: 'cosmetic',
      defaultDuration: 60,
      defaultPriceUzs: 1_200_000,
      translations: {
        uz: 'Oqartirish',
        'uz-Cyrl': 'Оқартириш',
        ru: 'Отбеливание',
        en: 'Whitening',
      },
    },
    {
      nameKey: 'service.orthodontic_consult',
      category: 'orthodontics',
      defaultDuration: 40,
      defaultPriceUzs: 200_000,
      translations: {
        uz: 'Ortodontik konsultatsiya',
        'uz-Cyrl': 'Ортодонтик консультация',
        ru: 'Ортодонтическая консультация',
        en: 'Orthodontic consultation',
      },
    },
    {
      nameKey: 'service.implant_consult',
      category: 'surgery',
      defaultDuration: 40,
      defaultPriceUzs: 250_000,
      translations: {
        uz: 'Implant konsultatsiyasi',
        'uz-Cyrl': 'Имплант консультацияси',
        ru: 'Консультация по имплантации',
        en: 'Implant consultation',
      },
    },
  ] as const;

  for (const tpl of catalogTemplates) {
    await prisma.service.upsert({
      where: { nameKey: tpl.nameKey },
      update: {
        name: tpl.translations.uz,
        translations: tpl.translations,
        category: tpl.category,
        defaultDuration: tpl.defaultDuration,
        defaultPriceUzs: tpl.defaultPriceUzs,
        isActive: true,
      },
      create: {
        name: tpl.translations.uz,
        nameKey: tpl.nameKey,
        translations: tpl.translations,
        category: tpl.category,
        defaultDuration: tpl.defaultDuration,
        defaultPriceUzs: tpl.defaultPriceUzs,
        isActive: true,
      },
    });
  }

  service = await prisma.service.findUniqueOrThrow({
    where: { nameKey: 'service.consultation' },
  });

  // Link all catalog services to demo clinic with default prices
  const allServices = await prisma.service.findMany({
    where: { nameKey: { startsWith: 'service.' }, isActive: true },
  });
  for (const svc of allServices) {
    await prisma.clinicService.upsert({
      where: {
        clinicId_serviceId: { clinicId: clinic.id, serviceId: svc.id },
      },
      update: {},
      create: {
        clinicId: clinic.id,
        serviceId: svc.id,
        priceUzs: svc.defaultPriceUzs,
        durationMinutes: svc.defaultDuration,
      },
    });
  }

  await prisma.doctorService.upsert({
    where: {
      doctorId_serviceId: { doctorId: doctor.id, serviceId: service.id },
    },
    update: {},
    create: { doctorId: doctor.id, serviceId: service.id },
  });

  // Assign a few more services to demo doctor
  for (const key of [
    'service.professional_cleaning',
    'service.filling',
    'service.root_canal',
  ]) {
    const svc = await prisma.service.findUnique({ where: { nameKey: key } });
    if (!svc) continue;
    await prisma.doctorService.upsert({
      where: {
        doctorId_serviceId: { doctorId: doctor.id, serviceId: svc.id },
      },
      update: {},
      create: { doctorId: doctor.id, serviceId: svc.id },
    });
  }

  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@denta.local' },
    update: { passwordHash, emailVerifiedAt: new Date() },
    create: {
      email: 'patient@denta.local',
      phone: '+998901000003',
      passwordHash,
      firstName: 'Javlonbek',
      lastName: 'Rahimov',
      emailVerifiedAt: new Date(),
    },
  });
  await ensureRole(patientUser.id, UserRole.PATIENT);

  const patient = await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      displayId: 'DNT-10001',
      gender: 'MALE',
      birthDate: new Date('1995-05-12'),
    },
  });

  await prisma.patientClinic.upsert({
    where: {
      clinicId_patientId: { clinicId: clinic.id, patientId: patient.id },
    },
    update: {},
    create: { clinicId: clinic.id, patientId: patient.id },
  });

  const roomExists = await prisma.room.findFirst({
    where: { clinicId: clinic.id, number: '1' },
  });
  if (!roomExists) {
    await prisma.room.create({
      data: {
        clinicId: clinic.id,
        branchId: branch.id,
        name: 'Kabinet 1',
        number: '1',
        status: 'AVAILABLE',
      },
    });
  }

  console.log('Seed OK');
  console.log('  Clinic CRM: clinic@denta.local / Demo1234');
  console.log('  Doctor App:  doctor@denta.local / Demo1234');
  console.log('  Client App:  patient@denta.local / Demo1234');
  console.log(`  Clinic: ${clinic.id}`);
  console.log(`  Doctor: ${doctor.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
