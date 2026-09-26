import { Inject, Injectable } from '@nestjs/common';
import {
  AppointmentStatus,
  Gender,
  Prisma,
  UserRole,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import { mapGender } from '../common/utils/enum-map.util';
import { isValidPassword } from '../common/utils/password.util';
import {
  isValidEmail,
  normalizeEmail,
  normalizePhone,
} from '../common/utils/phone.util';
import { PrismaService } from '../prisma/prisma.service';
import { generateTimeSlots } from '../slots/slot-generator';
import { resolveServiceName } from '../services/service-catalog';
import {
  STORAGE_SERVICE,
  StorageService,
} from '../storage/storage.types';
import {
  CreateClinicDoctorDto,
  DoctorScheduleEntryDto,
  ListDoctorsQueryDto,
  TopDoctorsQueryDto,
  UpdateDoctorProfileDto,
} from './dto/doctors.dto';

export type DoctorDto = {
  id: string;
  clinicId: string;
  fullName: string;
  photoUrl: string;
  specialization: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  gender: 'male' | 'female';
  languages: string[];
  bio: string;
  priceFrom: number;
  workingHours: { start: string; end: string };
  breakTime: { start: string; end: string };
  appointmentDurationMinutes: number;
  services: {
    id: string;
    name: string;
    nameKey?: string;
    names?: Record<string, string>;
    durationMinutes: number;
    price: number;
    category: string;
  }[];
};

export type DoctorProfileDto = {
  id: string;
  displayId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string | null;
  specialty: string;
  clinicId: string;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  phone: string;
  email: string;
  bio: string;
  languages: string[];
  workingHours: { start: string; end: string };
  weeklySchedule: {
    day: number;
    start: string;
    end: string;
    closed?: boolean;
  }[];
  appointmentDuration: number;
  notificationSettings: {
    newAppointment: boolean;
    cancelledAppointment: boolean;
    appointmentReminder: boolean;
    patientRescheduled: boolean;
    payment: boolean;
    clinicMessages: boolean;
  };
};

const DEFAULT_SCHEDULE: DoctorScheduleEntryDto[] = [1, 2, 3, 4, 5, 6].map(
  (dayOfWeek) => ({
    dayOfWeek,
    startTime: '09:00',
    endTime: '18:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    slotDuration: 30,
  }),
);

@Injectable()
export class DoctorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async list(query: ListDoctorsQueryDto): Promise<DoctorDto[]> {
    const q = query.query?.trim();
    const genderFilter =
      query.gender === 'female'
        ? Gender.FEMALE
        : query.gender === 'male'
          ? Gender.MALE
          : undefined;

    const doctors = await this.prisma.doctorProfile.findMany({
      where: {
        isActive: true,
        ...(query.specialization
          ? { specialty: { contains: query.specialization, mode: 'insensitive' } }
          : {}),
        ...(genderFilter ? { gender: genderFilter } : {}),
        ...(query.clinicId
          ? { clinics: { some: { clinicId: query.clinicId, isActive: true } } }
          : {}),
        ...(q
          ? {
              OR: [
                { specialty: { contains: q, mode: 'insensitive' } },
                { bio: { contains: q, mode: 'insensitive' } },
                {
                  user: {
                    OR: [
                      { firstName: { contains: q, mode: 'insensitive' } },
                      { lastName: { contains: q, mode: 'insensitive' } },
                    ],
                  },
                },
              ],
            }
          : {}),
      },
      include: this.doctorInclude(),
      take: query.limit ?? 50,
      skip: query.offset ?? 0,
      orderBy: [{ ratingAvg: 'desc' }, { reviewCount: 'desc' }],
    });

    return doctors.map((d) => this.toDoctorDto(d));
  }

  async top(query: TopDoctorsQueryDto): Promise<DoctorDto[]> {
    return this.list({ limit: query.limit ?? 10 });
  }

  async availableToday(query: TopDoctorsQueryDto): Promise<DoctorDto[]> {
    const tz = 'Asia/Tashkent';
    const today = format(toZonedTime(new Date(), tz), 'yyyy-MM-dd');
    const localDay = toZonedTime(new Date(), tz).getDay();
    const dayStart = fromZonedTime(`${today}T00:00:00`, tz);
    const dayEnd = fromZonedTime(`${today}T23:59:59`, tz);

    const doctors = await this.prisma.doctorProfile.findMany({
      where: {
        isActive: true,
        schedules: { some: { dayOfWeek: localDay, isActive: true } },
      },
      include: {
        ...this.doctorInclude(),
        appointments: {
          where: {
            startsAt: { gte: dayStart, lte: dayEnd },
            status: {
              notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
            },
          },
        },
      },
      take: query.limit ?? 10,
    });

    const available = doctors.filter((d) => {
      const schedule = d.schedules.find((s) => s.dayOfWeek === localDay);
      if (!schedule) return false;
      const slots = generateTimeSlots({
        workingHours: { start: schedule.startTime, end: schedule.endTime },
        breakTime:
          schedule.breakStart && schedule.breakEnd
            ? { start: schedule.breakStart, end: schedule.breakEnd }
            : null,
        durationMinutes:
          schedule.slotDuration ?? d.appointmentDurationMinutes ?? 30,
        date: today,
        bookings: d.appointments.map((a) => {
          const local = toZonedTime(a.startsAt, tz);
          return {
            date: today,
            time: `${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}`,
            status: a.status,
          };
        }),
      });
      return slots.some((s) => s.available);
    });

    return available.map((d) => this.toDoctorDto(d));
  }

  async getById(id: string): Promise<DoctorDto> {
    const doctor = await this.prisma.doctorProfile.findFirst({
      where: { id, isActive: true },
      include: this.doctorInclude(),
    });
    if (!doctor) throw new AppError('NOT_FOUND', 'Doctor not found', 404);
    return this.toDoctorDto(doctor);
  }

  async getMyProfile(userId: string, clinicId?: string | null): Promise<DoctorProfileDto> {
    const doctor = await this.requireDoctorProfile(userId, clinicId);
    return this.toDoctorProfileDto(doctor);
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateDoctorProfileDto,
  ): Promise<DoctorProfileDto> {
    const doctor = await this.requireDoctorProfile(userId);

    if (dto.email) {
      const email = normalizeEmail(dto.email);
      if (!isValidEmail(email)) {
        throw new AppError('INVALID_EMAIL', 'Invalid email', 400);
      }
      const taken = await this.prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (taken) throw new AppError('EMAIL_TAKEN', 'Email already in use', 409);
    }
    if (dto.phone) {
      const phone = normalizePhone(dto.phone);
      if (!phone) throw new AppError('INVALID_PHONE', 'Invalid phone', 400);
      const taken = await this.prisma.user.findFirst({
        where: { phone, NOT: { id: userId } },
      });
      if (taken) throw new AppError('PHONE_TAKEN', 'Phone already in use', 409);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.firstName ? { firstName: dto.firstName.trim() } : {}),
          ...(dto.lastName ? { lastName: dto.lastName.trim() } : {}),
          ...(dto.email ? { email: normalizeEmail(dto.email) } : {}),
          ...(dto.phone ? { phone: normalizePhone(dto.phone)! } : {}),
        },
      }),
      this.prisma.doctorProfile.update({
        where: { id: doctor.id },
        data: {
          ...(dto.specialty !== undefined ? { specialty: dto.specialty } : {}),
          ...(dto.experienceYears !== undefined
            ? { experienceYears: dto.experienceYears }
            : {}),
          ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
          ...(dto.languages !== undefined ? { languages: dto.languages } : {}),
          ...(dto.appointmentDuration !== undefined
            ? { appointmentDurationMinutes: dto.appointmentDuration }
            : {}),
          ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        },
      }),
    ]);

    return this.getMyProfile(userId, doctor.clinics[0]?.clinicId);
  }

  async uploadAvatar(
    userId: string,
    file: { buffer: Buffer; mimetype: string; size: number; originalname: string },
  ) {
    const allowed = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ]);
    if (!allowed.has(file.mimetype.toLowerCase())) {
      throw new AppError('INVALID_FILE', 'Only JPEG/PNG/WebP images allowed', 400);
    }
    const maxBytes = this.config.get<number>('app.uploadMaxBytes') ?? 5_242_880;
    if (file.size > maxBytes) {
      throw new AppError('FILE_TOO_LARGE', `Max upload size is ${maxBytes} bytes`, 400);
    }

    const doctor = await this.requireDoctorProfile(userId);
    const ext =
      file.mimetype.includes('png')
        ? '.png'
        : file.mimetype.includes('webp')
          ? '.webp'
          : '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(
      extname(file.originalname).toLowerCase(),
    )
      ? extname(file.originalname).toLowerCase()
      : ext;
    const key = `avatars/doctors/${doctor.id}/${randomUUID()}${safeExt}`;

    const uploaded = await this.storage.upload({
      key,
      buffer: file.buffer,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    const oldUrl = doctor.avatarUrl;
    await this.prisma.doctorProfile.update({
      where: { id: doctor.id },
      data: { avatarUrl: uploaded.url },
    });

    if (oldUrl?.includes('/uploads/')) {
      const oldKey = oldUrl.split('/uploads/')[1];
      if (oldKey) await this.storage.delete(oldKey).catch(() => undefined);
    }

    return {
      uri: uploaded.url,
      pendingUpload: false,
      avatarUrl: uploaded.url,
    };
  }

  async getMyDashboard(userId: string, clinicId?: string | null) {
    const doctor = await this.requireDoctorProfile(userId, clinicId);
    const link = doctor.clinics[0];
    if (!link && clinicId) {
      throw new AppError('FORBIDDEN', 'Doctor is not active in this clinic', 403);
    }
    const activeClinicId = link?.clinicId ?? clinicId ?? undefined;
    const tz = link?.clinic?.timezone ?? 'Asia/Tashkent';
    const now = new Date();
    const todayKey = format(toZonedTime(now, tz), 'yyyy-MM-dd');
    const dayStart = fromZonedTime(`${todayKey}T00:00:00`, tz);
    const dayEnd = fromZonedTime(`${todayKey}T23:59:59`, tz);
    const nowMinutes =
      toZonedTime(now, tz).getHours() * 60 +
      toZonedTime(now, tz).getMinutes();

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        startsAt: { gte: dayStart, lte: dayEnd },
        ...(activeClinicId ? { clinicId: activeClinicId } : {}),
      },
      orderBy: { startsAt: 'asc' },
    });

    const toAppt = (row: (typeof appointments)[0]) => {
      const local = toZonedTime(row.startsAt, tz);
      const y = local.getFullYear();
      const m = String(local.getMonth() + 1).padStart(2, '0');
      const d = String(local.getDate()).padStart(2, '0');
      const hh = String(local.getHours()).padStart(2, '0');
      const mm = String(local.getMinutes()).padStart(2, '0');
      const status =
        row.status === AppointmentStatus.COMPLETED
          ? 'completed'
          : row.status === AppointmentStatus.CANCELLED ||
              row.status === AppointmentStatus.NO_SHOW
            ? 'cancelled'
            : 'upcoming';
      return {
        id: row.id,
        doctorId: row.doctorId,
        clinicId: row.clinicId,
        patientId: row.patientId,
        patientName: row.patientName,
        doctorName: row.doctorName,
        clinicName: row.clinicName,
        clinicAddress: row.clinicAddress,
        serviceName: row.serviceName,
        date: `${y}-${m}-${d}`,
        time: `${hh}:${mm}`,
        status,
        price: row.priceUzs,
        notes: row.notes ?? undefined,
      };
    };

    const todayAppointments = appointments
      .filter(
        (a) =>
          a.status !== AppointmentStatus.CANCELLED &&
          a.status !== AppointmentStatus.NO_SHOW,
      )
      .map(toAppt);
    const completed = todayAppointments.filter((a) => a.status === 'completed');
    const remaining = todayAppointments.filter((a) => a.status === 'upcoming');

    const parseMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    let currentAppointment: ReturnType<typeof toAppt> | null = null;
    let nextAppointment: ReturnType<typeof toAppt> | null = null;
    const duration = doctor.appointmentDurationMinutes ?? 30;

    for (const appt of todayAppointments) {
      if (appt.status === 'cancelled') continue;
      const start = parseMin(appt.time);
      const end = start + duration;
      if (appt.status === 'upcoming' && nowMinutes >= start && nowMinutes < end) {
        currentAppointment = appt;
      } else if (
        appt.status === 'upcoming' &&
        start > nowMinutes &&
        !nextAppointment
      ) {
        nextAppointment = appt;
      }
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        doctorId: doctor.id,
        paidAt: { gte: dayStart, lte: dayEnd },
        status: 'PAID',
      },
    });
    const todayRevenue =
      payments.reduce((s, p) => s + p.amountUzs, 0) ||
      completed.reduce((s, a) => s + a.price, 0);

    const patientsToday = new Set(
      todayAppointments.map((a) => a.patientId),
    ).size;

    const localDay = toZonedTime(now, tz).getDay();
    const schedule = doctor.schedules.find(
      (s) => s.dayOfWeek === localDay && s.isActive,
    );
    let nextAvailableSlot: {
      start: string;
      end: string;
      durationMinutes: number;
    } | null = null;

    if (schedule) {
      const slots = generateTimeSlots({
        workingHours: { start: schedule.startTime, end: schedule.endTime },
        breakTime:
          schedule.breakStart && schedule.breakEnd
            ? { start: schedule.breakStart, end: schedule.breakEnd }
            : null,
        durationMinutes: schedule.slotDuration ?? duration,
        date: todayKey,
        bookings: appointments.map((a) => {
          const local = toZonedTime(a.startsAt, tz);
          return {
            date: todayKey,
            time: `${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}`,
            status: a.status,
          };
        }),
      });
      const slotDuration = schedule.slotDuration ?? duration;
      const free = slots.find(
        (s) => s.available && parseMin(s.time) >= nowMinutes,
      );
      if (free) {
        nextAvailableSlot = {
          start: free.time,
          end: formatMinutes(parseMin(free.time) + slotDuration),
          durationMinutes: slotDuration,
        };
      }
    }

    return {
      todayAppointments,
      completed,
      remaining,
      patientsToday,
      todayRevenue,
      nextAppointment,
      currentAppointment,
      nextAvailableSlot,
    };
  }

  async createClinicDoctor(clinicId: string, dto: CreateClinicDoctorDto) {
    const email = dto.email ? normalizeEmail(dto.email) : null;
    if (dto.email && (!email || !isValidEmail(email))) {
      throw new AppError('INVALID_EMAIL', 'Invalid email', 400);
    }
    const phone = normalizePhone(dto.phone);
    if (!phone) throw new AppError('INVALID_PHONE', 'Invalid phone', 400);

    const password = dto.password ?? `Denta${Math.random().toString(36).slice(2, 10)}`;
    if (!isValidPassword(password)) {
      throw new AppError(
        'INVALID_PASSWORD',
        'Password must be at least 8 characters with a letter and a digit',
        400,
      );
    }

    if (email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email } });
      if (existingEmail) throw new AppError('EMAIL_TAKEN', 'Email already registered', 409);
    }
    const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
    if (existingPhone) throw new AppError('PHONE_TAKEN', 'Phone already registered', 409);

    const passwordHash = await argon2.hash(password);
    const branch = await this.prisma.clinicBranch.findFirst({
      where: { clinicId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    const doctor = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email ?? undefined,
          phone,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          emailVerifiedAt: email ? new Date() : undefined,
          phoneVerifiedAt: new Date(),
        },
      });

      const profile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          specialty: dto.specialty,
          experienceYears: dto.experienceYears ?? 0,
        },
      });

      await tx.doctorClinic.create({
        data: {
          doctorId: profile.id,
          clinicId,
          branchId: branch?.id,
        },
      });

      await tx.userRoleAssignment.create({
        data: {
          userId: user.id,
          role: UserRole.DOCTOR,
          clinicId,
        },
      });

      await tx.doctorSchedule.createMany({
        data: DEFAULT_SCHEDULE.map((s) => ({
          doctorId: profile.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          breakStart: s.breakStart,
          breakEnd: s.breakEnd,
          slotDuration: s.slotDuration ?? 30,
        })),
      });

      const serviceIds = dto.serviceIds?.filter(Boolean) ?? [];
      if (serviceIds.length) {
        const clinicServices = await tx.clinicService.findMany({
          where: {
            clinicId,
            serviceId: { in: serviceIds },
            isActive: true,
          },
        });
        if (clinicServices.length) {
          await tx.doctorService.createMany({
            data: clinicServices.map((cs) => ({
              doctorId: profile.id,
              serviceId: cs.serviceId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return profile;
    });

    return this.getById(doctor.id);
  }

  async getMySchedule(userId: string, clinicId?: string | null) {
    const doctor = await this.requireDoctorProfile(userId, clinicId);
    return doctor.schedules
      .filter((s) => s.isActive)
      .map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        breakStart: s.breakStart ?? undefined,
        breakEnd: s.breakEnd ?? undefined,
        slotDuration: s.slotDuration,
      }));
  }

  async replaceMySchedule(
    userId: string,
    schedule: DoctorScheduleEntryDto[],
    clinicId?: string | null,
  ) {
    const doctor = await this.requireDoctorProfile(userId, clinicId);
    const link = doctor.clinics[0];
    if (!link) {
      throw new AppError('FORBIDDEN', 'Doctor is not active in this clinic', 403);
    }
    await this.prisma.$transaction([
      this.prisma.doctorSchedule.deleteMany({
        where: { doctorClinicId: link.id },
      }),
      this.prisma.doctorSchedule.createMany({
        data: schedule.map((s) => ({
          doctorId: doctor.id,
          doctorClinicId: link.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          breakStart: s.breakStart,
          breakEnd: s.breakEnd,
          slotDuration: s.slotDuration ?? doctor.appointmentDurationMinutes,
        })),
      }),
    ]);
    return this.getMySchedule(userId, clinicId ?? link.clinicId);
  }

  assertDoctorRole(user: AuthUser) {
    if (!user.roles.includes(UserRole.DOCTOR)) {
      throw new AppError('FORBIDDEN', 'Doctor role required', 403);
    }
  }

  async requireDoctorProfile(userId: string, clinicId?: string | null) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        schedules: {
          where: {
            isActive: true,
            ...(clinicId
              ? { doctorClinic: { clinicId, isActive: true } }
              : {}),
          },
          orderBy: { dayOfWeek: 'asc' },
        },
        clinics: {
          where: {
            isActive: true,
            ...(clinicId ? { clinicId } : {}),
          },
          include: {
            clinic: {
              include: {
                branches: {
                  where: { isActive: true },
                  orderBy: [{ isPrimary: 'desc' }],
                  take: 1,
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: clinicId ? 1 : undefined,
        },
        services: {
          where: { isActive: true },
          include: { service: true },
        },
      },
    });
    if (!doctor) throw new AppError('NOT_FOUND', 'Doctor profile not found', 404);
    if (clinicId && doctor.clinics.length === 0) {
      throw new AppError('FORBIDDEN', 'Doctor is not active in this clinic', 403);
    }
    return doctor;
  }

  private doctorInclude() {
    return {
      user: true,
      schedules: { where: { isActive: true }, orderBy: { dayOfWeek: 'asc' } },
      clinics: {
        where: { isActive: true },
        include: {
          clinic: {
            include: {
              services: {
                where: { isActive: true },
                include: { service: true },
              },
            },
          },
        },
        take: 1,
      },
      services: {
        where: { isActive: true },
        include: { service: true },
      },
    } satisfies Prisma.DoctorProfileInclude;
  }

  private toDoctorDto(
    doctor: Prisma.DoctorProfileGetPayload<{
      include: ReturnType<DoctorsService['doctorInclude']>;
    }>,
  ): DoctorDto {
    const link = doctor.clinics[0];
    const clinicId = link?.clinicId ?? '';
    const todaySchedule = doctor.schedules.find(
      (s) => s.dayOfWeek === new Date().getDay(),
    );
    const schedule = todaySchedule ?? doctor.schedules[0];
    const workingHours = schedule
      ? { start: schedule.startTime, end: schedule.endTime }
      : { start: '09:00', end: '18:00' };
    const breakTime =
      schedule?.breakStart && schedule?.breakEnd
        ? { start: schedule.breakStart, end: schedule.breakEnd }
        : { start: '13:00', end: '14:00' };

    const clinicServices = link?.clinic?.services ?? [];
    const services = doctor.services.map((ds) => {
      const cs = clinicServices.find((c) => c.serviceId === ds.serviceId);
      const resolved = resolveServiceName(
        ds.service.translations,
        ds.service.name,
      );
      return {
        id: ds.service.id,
        name: cs?.customName?.trim() || resolved,
        nameKey: ds.service.nameKey ?? undefined,
        names:
          ds.service.translations && typeof ds.service.translations === 'object'
            ? (ds.service.translations as Record<string, string>)
            : undefined,
        durationMinutes: cs?.durationMinutes ?? ds.service.defaultDuration,
        price: cs?.priceUzs ?? doctor.priceFromUzs ?? 0,
        category: ds.service.category,
      };
    });

    return {
      id: doctor.id,
      clinicId,
      fullName: `${doctor.user.firstName} ${doctor.user.lastName}`.trim(),
      photoUrl: doctor.avatarUrl ?? '',
      specialization: doctor.specialty ?? '',
      experienceYears: doctor.experienceYears,
      rating: doctor.ratingAvg,
      reviewCount: doctor.reviewCount,
      gender: mapGender(doctor.gender),
      languages: doctor.languages,
      bio: doctor.bio ?? '',
      priceFrom: doctor.priceFromUzs ?? services[0]?.price ?? 0,
      workingHours,
      breakTime,
      appointmentDurationMinutes: doctor.appointmentDurationMinutes,
      services,
    };
  }

  private toDoctorProfileDto(
    doctor: Awaited<ReturnType<DoctorsService['requireDoctorProfile']>>,
  ): DoctorProfileDto {
    const link = doctor.clinics[0];
    const branch = link?.clinic?.branches?.[0];
    const todaySchedule = doctor.schedules.find(
      (s) => s.dayOfWeek === new Date().getDay(),
    );
    const schedule = todaySchedule ?? doctor.schedules[0];

    return {
      id: doctor.id,
      displayId: doctor.id.slice(-8).toUpperCase(),
      firstName: doctor.user.firstName,
      lastName: doctor.user.lastName,
      fullName: `${doctor.user.firstName} ${doctor.user.lastName}`.trim(),
      avatar: doctor.avatarUrl,
      specialty: doctor.specialty ?? '',
      clinicId: link?.clinicId ?? '',
      clinicName: link?.clinic?.name ?? '',
      clinicAddress: branch?.address ?? '',
      clinicCity: branch?.city ?? '',
      experienceYears: doctor.experienceYears,
      rating: doctor.ratingAvg,
      reviewCount: doctor.reviewCount,
      phone: doctor.user.phone ?? '',
      email: doctor.user.email ?? '',
      bio: doctor.bio ?? '',
      languages: doctor.languages,
      workingHours: schedule
        ? { start: schedule.startTime, end: schedule.endTime }
        : { start: '09:00', end: '18:00' },
      weeklySchedule: [0, 1, 2, 3, 4, 5, 6].map((day) => {
        const entry = doctor.schedules.find((s) => s.dayOfWeek === day);
        if (!entry) return { day, start: '09:00', end: '18:00', closed: true };
        return {
          day,
          start: entry.startTime,
          end: entry.endTime,
        };
      }),
      appointmentDuration: doctor.appointmentDurationMinutes,
      notificationSettings: {
        newAppointment: true,
        cancelledAppointment: true,
        appointmentReminder: true,
        patientRescheduled: true,
        payment: true,
        clinicMessages: true,
      },
    };
  }
}

function formatMinutes(total: number): string {
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
