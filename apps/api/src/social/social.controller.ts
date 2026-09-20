import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/guards/auth.guards';
import { Public } from '../common/guards/auth.guards';
import { AppError } from '../common/filters/global-exception.filter';
import { PrismaService } from '../prisma/prisma.service';

class CreateReviewDto {
  @IsOptional()
  @IsString()
  clinicId?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  comment?: string;
}

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const [clinics, doctors] = await Promise.all([
      this.prisma.favoriteClinic.findMany({ where: { userId: user.id } }),
      this.prisma.favoriteDoctor.findMany({ where: { userId: user.id } }),
    ]);
    return {
      clinicIds: clinics.map((c) => c.clinicId),
      doctorIds: doctors.map((d) => d.doctorId),
    };
  }

  @Post('clinics/:id')
  async addClinic(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.prisma.favoriteClinic.upsert({
      where: { userId_clinicId: { userId: user.id, clinicId: id } },
      create: { userId: user.id, clinicId: id },
      update: {},
    });
    return { ok: true };
  }

  @Delete('clinics/:id')
  async removeClinic(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.prisma.favoriteClinic.deleteMany({
      where: { userId: user.id, clinicId: id },
    });
    return { ok: true };
  }

  @Post('doctors/:id')
  async addDoctor(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.prisma.favoriteDoctor.upsert({
      where: { userId_doctorId: { userId: user.id, doctorId: id } },
      create: { userId: user.id, doctorId: id },
      update: {},
    });
    return { ok: true };
  }

  @Delete('doctors/:id')
  async removeDoctor(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.prisma.favoriteDoctor.deleteMany({
      where: { userId: user.id, doctorId: id },
    });
    return { ok: true };
  }
}

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async list() {
    return this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Public()
  @Get('clinics/:clinicId')
  async byClinic(@Param('clinicId') clinicId: string) {
    const rows = await this.prisma.review.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      comment: r.comment ?? '',
      date: r.createdAt.toISOString().slice(0, 10),
      doctorId: r.doctorId ?? undefined,
      clinicId: r.clinicId ?? undefined,
    }));
  }

  @Public()
  @Get('doctors/:doctorId')
  async byDoctor(@Param('doctorId') doctorId: string) {
    const rows = await this.prisma.review.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      comment: r.comment ?? '',
      date: r.createdAt.toISOString().slice(0, 10),
      doctorId: r.doctorId ?? undefined,
      clinicId: r.clinicId ?? undefined,
    }));
  }

  @ApiBearerAuth()
  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    if (!dto.clinicId && !dto.doctorId) {
      throw new AppError('UNKNOWN', 'clinicId or doctorId required', 400);
    }
    if (dto.appointmentId) {
      const appt = await this.prisma.appointment.findUnique({
        where: { id: dto.appointmentId },
      });
      if (!appt || appt.status !== 'COMPLETED') {
        throw new AppError(
          'FORBIDDEN',
          'Reviews require a completed appointment',
          403,
        );
      }
    }
    const patient = await this.prisma.patientProfile.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });
    const authorName = patient
      ? `${patient.user.firstName} ${patient.user.lastName}`.trim()
      : 'Patient';

    const review = await this.prisma.review.create({
      data: {
        userId: user.id,
        clinicId: dto.clinicId,
        doctorId: dto.doctorId,
        patientId: patient?.id,
        appointmentId: dto.appointmentId,
        rating: dto.rating,
        comment: dto.comment,
        authorName,
      },
    });

    if (dto.clinicId) {
      const agg = await this.prisma.review.aggregate({
        where: { clinicId: dto.clinicId },
        _avg: { rating: true },
        _count: true,
      });
      await this.prisma.clinic.update({
        where: { id: dto.clinicId },
        data: {
          ratingAvg: agg._avg.rating ?? 0,
          reviewCount: agg._count,
        },
      });
    }
    if (dto.doctorId) {
      const agg = await this.prisma.review.aggregate({
        where: { doctorId: dto.doctorId },
        _avg: { rating: true },
        _count: true,
      });
      await this.prisma.doctorProfile.update({
        where: { id: dto.doctorId },
        data: {
          ratingAvg: agg._avg.rating ?? 0,
          reviewCount: agg._count,
        },
      });
    }

    return review;
  }
}
