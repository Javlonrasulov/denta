import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppError } from '../common/filters/global-exception.filter';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateClinicBranchDto,
  NearbyClinicsQueryDto,
  PublishClinicDto,
  SearchClinicsQueryDto,
  UpdateClinicProfileDto,
} from './dto/clinics.dto';

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
  workingHours: { day: number; open: string; close: string; closed?: boolean }[];
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
  distance_km: number;
};

@Injectable()
export class ClinicsService {
  constructor(private readonly prisma: PrismaService) {}

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
      isOpenNow: this.computeIsOpenNow(this.parseWorkingHours(r.working_hours)),
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
    const clinic = await this.prisma.clinic.update({
      where: { id: clinicId },
      data: {
        name: dto.name,
        about: dto.about,
        phone: dto.phone,
        logoUrl: dto.logoUrl,
        coverUrl: dto.coverUrl,
        photos: dto.photos,
        specializations: dto.specializations,
        priceFromUzs: dto.priceFromUzs,
      },
    });

    if (dto.workingHours) {
      const primary = await this.prisma.clinicBranch.findFirst({
        where: { clinicId, isActive: true },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      });
      if (primary) {
        await this.prisma.clinicBranch.update({
          where: { id: primary.id },
          data: {
            workingHours: dto.workingHours as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }

    return this.getMyClinic(clinic.id);
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
      isOpenNow: this.computeIsOpenNow(workingHours),
      specializations: clinic.specializations,
      photos: clinic.photos,
      about: clinic.about ?? '',
      priceFrom: clinic.priceFromUzs ?? 0,
    };
  }

  private parseWorkingHours(
    raw: unknown,
  ): MarketplaceClinicDto['workingHours'] {
    if (Array.isArray(raw)) {
      return raw as MarketplaceClinicDto['workingHours'];
    }
    // Default Mon–Sat 09:00–18:00
    return [1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      open: '09:00',
      close: '18:00',
    }));
  }

  private computeIsOpenNow(
    hours: MarketplaceClinicDto['workingHours'],
  ): boolean {
    const now = new Date();
    const day = now.getDay();
    const entry = hours.find((h) => h.day === day);
    if (!entry || entry.closed) return false;
    const mins = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = entry.open.split(':').map(Number);
    const [ch, cm] = entry.close.split(':').map(Number);
    return mins >= oh * 60 + om && mins <= ch * 60 + cm;
  }
}
