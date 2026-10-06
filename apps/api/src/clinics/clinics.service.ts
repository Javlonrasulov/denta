import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { AppError } from '../common/filters/global-exception.filter';
import { isValidEmail, normalizeEmail } from '../common/utils/phone.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  checkIntervalAgainstClinic,
  clinicDayRule,
  normalizeClinicWorkingHours,
  parseClinicWorkingHours,
  validateClinicWorkingHours,
  type ClinicWorkingDay,
} from '../slots/clinic-hours';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.types';
import {
  CreateClinicBranchDto,
  NearbyClinicsQueryDto,
  PublishClinicDto,
  SearchClinicsQueryDto,
  UpdateClinicProfileDto,
  WorkingHoursDayDto,
} from './dto/clinics.dto';

export type ScheduleConflict = {
  appointmentId: string;
  date: string;
  time: string;
  endTime: string;
  patientName: string;
  doctorName: string;
  reason: 'closed' | 'outside_hours' | 'lunch';
};

/** Frontend-compatible clinic card (marketplace). */
export type MarketplaceClinicDto = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  coverUrl: string;
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  coordinates: { latitude: number; longitude: number };
  workingHours: ClinicWorkingDay[];
  isOpenNow: boolean;
  specializations: string[];
  photos: string[];
  about: string;
  priceFrom: number;
  distanceKm?: number;
};

type NearbyRow = {
  clinic_id: string;
  branch_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  rating_avg: number;
  review_count: number;
  address: string;
  phone: string | null;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  specializations: string[];
  photos: string[];
  about: string | null;
  price_from_uzs: number | null;
  working_hours: unknown;
  timezone: string | null;
  distance_km: number;
};

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/** undefined = leave unchanged, blank string = clear (null). */
function optionalText(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function validatedWorkingHours(
  input: WorkingHoursDayDto[],
): ClinicWorkingDay[] {
  const issues = validateClinicWorkingHours(input);
  if (issues.length) {
    const lunch = issues.find((i) => i.code === 'LUNCH_OUTSIDE_HOURS');
    throw new AppError(
      'VALIDATION_ERROR',
      lunch
        ? 'Tushlik vaqti ish vaqtining ichida bo‘lishi kerak.'
        : 'Ish vaqti noto‘g‘ri kiritilgan.',
      400,
      { field: 'workingHours', issues },
    );
  }
  return normalizeClinicWorkingHours(input);
}

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

@Injectable()
export class ClinicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async search(query: SearchClinicsQueryDto): Promise<MarketplaceClinicDto[]> {
    const q = query.query?.trim();
    const clinics = await this.prisma.clinic.findMany({
      where: {
        isMarketplaceVisible: true,
        accountStatus: 'ACTIVE',
        ...(query.minRating != null
          ? { ratingAvg: { gte: query.minRating } }
          : {}),
        ...(query.specialization
          ? { specializations: { has: query.specialization } }
          : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { about: { contains: q, mode: 'insensitive' } },
                {
                  doctorLinks: {
                    some: {
                      doctor: {
                        OR: [
                          {
                            user: {
                              firstName: { contains: q, mode: 'insensitive' },
                            },
                          },
                          {
                            user: {
                              lastName: { contains: q, mode: 'insensitive' },
                            },
                          },
                          {
                            specialty: { contains: q, mode: 'insensitive' },
                          },
                        ],
                      },
                    },
                  },
                },
                {
                  services: {
                    some: {
                      service: {
                        name: { contains: q, mode: 'insensitive' },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
        ...(query.city
          ? {
              branches: {
                some: {
                  city: { equals: query.city, mode: 'insensitive' },
                  isActive: true,
                },
              },
            }
          : {}),
      },
      include: {
        branches: {
          where: { isActive: true },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          take: 1,
        },
      },
      take: query.limit ?? 50,
      skip: query.offset ?? 0,
      orderBy: { ratingAvg: 'desc' },
    });

    return clinics
      .filter((c) => c.branches[0])
      .map((c) => this.toMarketplace(c, c.branches[0]));
  }

  async nearby(query: NearbyClinicsQueryDto): Promise<MarketplaceClinicDto[]> {
    const radius = query.radiusKm ?? 10;
    const limit = query.limit ?? 20;

    // Haversine (km) — works without PostGIS on local Windows PostgreSQL.
    const rows = await this.prisma.$queryRaw<NearbyRow[]>`
      SELECT
        c.id AS clinic_id,
        b.id AS branch_id,
        c.name,
        c.slug,
        c."logoUrl" AS logo_url,
        c."coverUrl" AS cover_url,
        c."ratingAvg" AS rating_avg,
        c."reviewCount" AS review_count,
        b.address,
        COALESCE(b.phone, c.phone) AS phone,
        b.latitude,
        b.longitude,
        c.specializations,
        c.photos,
        c.about,
        c."priceFromUzs" AS price_from_uzs,
        b."workingHours" AS working_hours,
        b.timezone,
        (
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(${query.latitude})) * cos(radians(b.latitude::float))
              * cos(radians(b.longitude::float) - radians(${query.longitude}))
              + sin(radians(${query.latitude})) * sin(radians(b.latitude::float))
            ))
          )
        ) AS distance_km
      FROM "ClinicBranch" b
      INNER JOIN "Clinic" c ON c.id = b."clinicId"
      WHERE b."isActive" = true
        AND c."isMarketplaceVisible" = true
        AND c."accountStatus" = 'ACTIVE'
        AND (
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(${query.latitude})) * cos(radians(b.latitude::float))
              * cos(radians(b.longitude::float) - radians(${query.longitude}))
              + sin(radians(${query.latitude})) * sin(radians(b.latitude::float))
            ))
          )
        ) <= ${radius}
        ${query.minRating != null ? Prisma.sql`AND c."ratingAvg" >= ${query.minRating}` : Prisma.empty}
        ${query.specialty ? Prisma.sql`AND ${query.specialty} = ANY(c.specializations)` : Prisma.empty}
      ORDER BY distance_km ASC
      LIMIT ${limit}
    `;

    return rows.map((r) => ({
      id: r.clinic_id,
      name: r.name,
      slug: r.slug,
      logoUrl: r.logo_url ?? '',
      coverUrl: r.cover_url ?? '',
      rating: r.rating_avg,
      reviewCount: r.review_count,
      address: r.address,
      phone: r.phone ?? '',
      coordinates: {
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
      },
      workingHours: this.parseWorkingHours(r.working_hours),
      isOpenNow: this.computeIsOpenNow(r.working_hours, r.timezone),
      specializations: r.specializations ?? [],
      photos: r.photos ?? [],
      about: r.about ?? '',
      priceFrom: r.price_from_uzs ?? 0,
      distanceKm: Math.round(Number(r.distance_km) * 10) / 10,
    }));
  }

  async getById(id: string): Promise<MarketplaceClinicDto> {
    const clinic = await this.prisma.clinic.findFirst({
      where: { id, isMarketplaceVisible: true },
      include: {
        branches: {
          where: { isActive: true },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          take: 1,
        },
      },
    });
    if (!clinic?.branches[0]) {
      throw new AppError('NOT_FOUND', 'Clinic not found', 404);
    }
    return this.toMarketplace(clinic, clinic.branches[0]);
  }

  async addBranch(clinicId: string, dto: CreateClinicBranchDto) {
    if (dto.isPrimary) {
      await this.prisma.clinicBranch.updateMany({
        where: { clinicId },
        data: { isPrimary: false },
      });
    }
    return this.prisma.clinicBranch.create({
      data: {
        clinicId,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        region: dto.region,
        phone: dto.phone,
        email: dto.email,
        latitude: dto.latitude,
        longitude: dto.longitude,
        timezone: dto.timezone ?? 'Asia/Tashkent',
        isPrimary: dto.isPrimary ?? false,
      },
    });
  }

  async listMyBranches(clinicId: string) {
    return this.prisma.clinicBranch.findMany({
      where: { clinicId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    });
  }

  async getMyClinic(clinicId: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        branches: { where: { isActive: true }, orderBy: { isPrimary: 'desc' } },
        subscription: true,
      },
    });
    if (!clinic) throw new AppError('NOT_FOUND', 'Clinic not found', 404);
    const completion = this.profileCompletion(clinic);
    return { ...clinic, profileCompletion: completion };
  }

  async updateProfile(clinicId: string, dto: UpdateClinicProfileDto) {
    const email = optionalText(dto.email);
    if (email && !isValidEmail(email)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid email', 400, {
        field: 'email',
      });
    }
    const timezone = dto.timezone?.trim();
    if (timezone && !isValidTimeZone(timezone)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid timezone', 400, {
        field: 'timezone',
      });
    }
    const specializations = dto.specializations
      ?.map((s) => s.trim())
      .filter(Boolean);
    const workingHours = dto.workingHours
      ? (validatedWorkingHours(dto.workingHours) as unknown as Prisma.InputJsonValue)
      : undefined;

    await this.prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.update({
        where: { id: clinicId },
        data: {
          name: dto.name?.trim(),
          about: optionalText(dto.about),
          phone: optionalText(dto.phone),
          email: email === undefined ? undefined : email && normalizeEmail(email),
          timezone,
          logoUrl: optionalText(dto.logoUrl),
          coverUrl: optionalText(dto.coverUrl),
          photos: dto.photos,
          specializations: specializations
            ? [...new Set(specializations)]
            : undefined,
          priceFromUzs: dto.priceFromUzs,
        },
      });

      if (!dto.location && !workingHours && !timezone) return;

      const primary = await tx.clinicBranch.findFirst({
        where: { clinicId, isActive: true },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      });

      const branchData: Prisma.ClinicBranchUncheckedUpdateInput = {
        ...(timezone ? { timezone } : {}),
        ...(workingHours ? { workingHours } : {}),
        ...(dto.location
          ? {
              address: dto.location.address.trim(),
              city: dto.location.city.trim(),
              region: optionalText(dto.location.region) ?? null,
              latitude: dto.location.latitude,
              longitude: dto.location.longitude,
            }
          : {}),
      };

      if (primary) {
        await tx.clinicBranch.update({
          where: { id: primary.id },
          data: { ...branchData, isPrimary: true },
        });
      } else if (dto.location) {
        await tx.clinicBranch.create({
          data: {
            clinicId,
            name: clinic.name,
            address: dto.location.address.trim(),
            city: dto.location.city.trim(),
            region: optionalText(dto.location.region) ?? null,
            latitude: dto.location.latitude,
            longitude: dto.location.longitude,
            timezone: clinic.timezone,
            isPrimary: true,
            ...(workingHours ? { workingHours } : {}),
          },
        });
      }
    });

    return this.getMyClinic(clinicId);
  }

  /**
   * Upcoming appointments that a proposed schedule would place on a closed
   * day, outside hours, or inside lunch. Read-only: nothing is cancelled.
   */
  async previewScheduleConflicts(
    clinicId: string,
    input: WorkingHoursDayDto[],
  ): Promise<{ conflicts: ScheduleConflict[]; total: number }> {
    const hours = validatedWorkingHours(input);
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        timezone: true,
        branches: {
          where: { isActive: true },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          take: 1,
          select: { id: true, timezone: true },
        },
      },
    });
    if (!clinic) throw new AppError('NOT_FOUND', 'Clinic not found', 404);
    const branch = clinic.branches[0];
    const tz = branch?.timezone ?? clinic.timezone ?? 'Asia/Tashkent';

    const rows = await this.prisma.appointment.findMany({
      where: {
        clinicId,
        startsAt: { gte: new Date() },
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS,
          ],
        },
        ...(branch ? { OR: [{ branchId: branch.id }, { branchId: null }] } : {}),
      },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        patientName: true,
        doctorName: true,
      },
    });

    const conflicts: ScheduleConflict[] = [];
    for (const row of rows) {
      const start = toZonedTime(row.startsAt, tz);
      const end = toZonedTime(row.endsAt, tz);
      const startMin = start.getHours() * 60 + start.getMinutes();
      const sameDay = format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd');
      const endMin = sameDay ? end.getHours() * 60 + end.getMinutes() : 24 * 60;
      const verdict = checkIntervalAgainstClinic(
        clinicDayRule(hours, start.getDay()),
        startMin,
        endMin,
      );
      if (verdict === 'ok') continue;
      conflicts.push({
        appointmentId: row.id,
        date: format(start, 'yyyy-MM-dd'),
        time: format(start, 'HH:mm'),
        endTime: format(end, 'HH:mm'),
        patientName: row.patientName,
        doctorName: row.doctorName,
        reason: verdict,
      });
    }
    return { conflicts: conflicts.slice(0, 50), total: conflicts.length };
  }

  async uploadMedia(
    clinicId: string,
    kind: 'logo' | 'cover',
    file: { buffer: Buffer; mimetype: string; size: number; originalname: string },
  ) {
    const mime = file.mimetype.toLowerCase();
    const ext = ALLOWED_IMAGE_TYPES[mime];
    if (!ext) {
      throw new AppError('INVALID_FILE', 'Only JPEG/PNG/WebP images allowed', 400);
    }
    const maxBytes = this.config.get<number>('app.uploadMaxBytes') ?? 5_242_880;
    if (file.size > maxBytes) {
      throw new AppError('FILE_TOO_LARGE', `Max upload size is ${maxBytes} bytes`, 400);
    }

    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { logoUrl: true, coverUrl: true },
    });
    if (!clinic) throw new AppError('NOT_FOUND', 'Clinic not found', 404);

    const uploaded = await this.storage.upload({
      key: `clinics/${clinicId}/${kind}/${randomUUID()}${ext}`,
      buffer: file.buffer,
      mimeType: mime,
      sizeBytes: file.size,
    });

    const field = kind === 'logo' ? 'logoUrl' : 'coverUrl';
    await this.prisma.clinic.update({
      where: { id: clinicId },
      data: { [field]: uploaded.url },
    });

    const oldUrl = clinic[field];
    if (oldUrl?.includes('/uploads/')) {
      const oldKey = oldUrl.split('/uploads/')[1];
      if (oldKey) await this.storage.delete(oldKey).catch(() => undefined);
    }

    return this.getMyClinic(clinicId);
  }

  /**
   * Publish to marketplace when email-verified clinic meets minimum profile.
   */
  async publish(clinicId: string, dto: PublishClinicDto) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        branches: { where: { isActive: true } },
        doctorLinks: { where: { isActive: true }, take: 1 },
        services: { where: { isActive: true }, take: 1 },
      },
    });
    if (!clinic) throw new AppError('NOT_FOUND', 'Clinic not found', 404);
    if (clinic.accountStatus !== 'ACTIVE') {
      throw new AppError(
        'EMAIL_NOT_VERIFIED',
        'Clinic must verify email before publishing',
        400,
      );
    }

    const wantVisible = dto.isMarketplaceVisible ?? true;
    if (wantVisible) {
      const completion = this.profileCompletion(clinic);
      if (completion.percent < 60 || !clinic.branches.length) {
        throw new AppError(
          'FORBIDDEN',
          'Complete clinic profile (address/branch, about, phone) before publishing',
          400,
          { completion },
        );
      }
    }

    return this.prisma.clinic.update({
      where: { id: clinicId },
      data: {
        isMarketplaceVisible: wantVisible,
        bookingEnabled: dto.bookingEnabled ?? wantVisible,
      },
    });
  }

  profileCompletion(clinic: {
    name: string;
    about: string | null;
    phone: string | null;
    logoUrl: string | null;
    specializations: string[];
    branches?: { id: string; address: string }[];
    doctorLinks?: unknown[];
    services?: unknown[];
  }) {
    const checks = {
      name: Boolean(clinic.name?.trim()),
      about: Boolean(clinic.about && clinic.about.length >= 20),
      phone: Boolean(clinic.phone),
      logo: Boolean(clinic.logoUrl),
      specializations: (clinic.specializations?.length ?? 0) > 0,
      branch: (clinic.branches?.length ?? 0) > 0,
      doctor: (clinic.doctorLinks?.length ?? 0) > 0,
      service: (clinic.services?.length ?? 0) > 0,
    };
    const values = Object.values(checks);
    const done = values.filter(Boolean).length;
    return {
      percent: Math.round((done / values.length) * 100),
      checks,
    };
  }

  private toMarketplace(
    clinic: {
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
      coverUrl: string | null;
      ratingAvg: number;
      reviewCount: number;
      phone: string | null;
      specializations: string[];
      photos: string[];
      about: string | null;
      priceFromUzs: number | null;
    },
    branch: {
      address: string;
      phone: string | null;
      latitude: Prisma.Decimal;
      longitude: Prisma.Decimal;
      workingHours: unknown;
      timezone?: string | null;
    },
  ): MarketplaceClinicDto {
    const workingHours = this.parseWorkingHours(branch.workingHours);
    return {
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
      logoUrl: clinic.logoUrl ?? '',
      coverUrl: clinic.coverUrl ?? '',
      rating: clinic.ratingAvg,
      reviewCount: clinic.reviewCount,
      address: branch.address,
      phone: branch.phone ?? clinic.phone ?? '',
      coordinates: {
        latitude: Number(branch.latitude),
        longitude: Number(branch.longitude),
      },
      workingHours,
      isOpenNow: this.computeIsOpenNow(branch.workingHours, branch.timezone),
      specializations: clinic.specializations,
      photos: clinic.photos,
      about: clinic.about ?? '',
      priceFrom: clinic.priceFromUzs ?? 0,
    };
  }

  private parseWorkingHours(
    raw: unknown,
  ): MarketplaceClinicDto['workingHours'] {
    const parsed = parseClinicWorkingHours(raw);
    if (parsed) return parsed;
    // Default Mon–Sat 09:00–18:00
    return [1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      open: '09:00',
      close: '18:00',
    }));
  }

  /** Evaluated in the branch timezone; lunch counts as closed. */
  private computeIsOpenNow(rawHours: unknown, timezone?: string | null): boolean {
    const now = toZonedTime(new Date(), timezone || 'Asia/Tashkent');
    const rule = clinicDayRule(this.parseWorkingHours(rawHours), now.getDay());
    if (rule.kind !== 'open') return false;
    const mins = now.getHours() * 60 + now.getMinutes();
    return checkIntervalAgainstClinic(rule, mins, mins + 1) === 'ok';
  }
}
