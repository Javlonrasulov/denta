import { Injectable } from '@nestjs/common';
import { Gender, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { format } from 'date-fns';
import { AppError } from '../common/filters/global-exception.filter';
import {
  mapClinicalStatus,
  mapGender,
  mapGenderToPrisma,
  mapToothCondition,
  mapToothConditionToPrisma,
} from '../common/utils/enum-map.util';
import { normalizePhone } from '../common/utils/phone.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePatientDto,
  ListPatientsQueryDto,
  ToothRecordDto,
} from './dto/patients.dto';

export type PatientDto = {
  id: string;
  displayId?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  gender: 'male' | 'female';
  birthDate: string;
  lastVisit?: string;
  nextAppointment?: string;
  nextAppointmentTime?: string;
  status: 'active' | 'inactive';
  clinicalStatus?: ReturnType<typeof mapClinicalStatus>;
  notes?: string;
  avatar?: string;
  balance?: number;
  visitCount?: number;
  createdAt?: string;
};

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clinicId: string, query: ListPatientsQueryDto): Promise<PatientDto[]> {
    const q = query.q?.trim();
    const links = await this.prisma.patientClinic.findMany({
      where: {
        clinicId,
        isActive: true,
        ...(q
          ? {
              OR: [
                {
                  patient: {
                    user: {
                      OR: [
                        { firstName: { contains: q, mode: 'insensitive' } },
                        { lastName: { contains: q, mode: 'insensitive' } },
                        { phone: { contains: q } },
                      ],
                    },
                  },
                },
                { patient: { displayId: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        patient: {
          include: {
            user: true,
            appointments: {
              where: {
                clinicId,
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
                startsAt: { gte: new Date() },
              },
              orderBy: { startsAt: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    return links.map((link) => this.toPatientDto(link));
  }

  async getById(clinicId: string, patientId: string): Promise<PatientDto> {
    const link = await this.requirePatientLink(clinicId, patientId);
    return this.toPatientDto(link);
  }

  async create(clinicId: string, dto: CreatePatientDto): Promise<PatientDto> {
    const phone = normalizePhone(dto.phone);
    if (!phone) throw new AppError('INVALID_PHONE', 'Invalid phone', 400);

    let user = await this.prisma.user.findUnique({ where: { phone } });
    let patient = user
      ? await this.prisma.patientProfile.findUnique({ where: { userId: user.id } })
      : null;

    if (!patient) {
      const passwordHash = await argon2.hash(
        `Patient${Math.random().toString(36).slice(2, 10)}`,
      );
      const created = await this.prisma.$transaction(async (tx) => {
        const u =
          user ??
          (await tx.user.create({
            data: {
              phone,
              passwordHash,
              firstName: dto.firstName.trim(),
              lastName: dto.lastName.trim(),
              phoneVerifiedAt: new Date(),
            },
          }));
        const p = await tx.patientProfile.create({
          data: {
            userId: u.id,
            gender: mapGenderToPrisma(dto.gender) ?? Gender.MALE,
            birthDate: new Date(dto.birthDate),
            notes: dto.notes,
            displayId: `P-${Date.now().toString(36).toUpperCase()}`,
          },
        });
        return p;
      });
      patient = created;
    }

    await this.prisma.patientClinic.upsert({
      where: {
        clinicId_patientId: { clinicId, patientId: patient.id },
      },
      create: {
        clinicId,
        patientId: patient.id,
        notes: dto.notes,
      },
      update: {
        isActive: true,
        ...(dto.notes ? { notes: dto.notes } : {}),
      },
    });

    return this.getById(clinicId, patient.id);
  }

  async patchNotes(clinicId: string, patientId: string, notes: string) {
    await this.requirePatientLink(clinicId, patientId);
    await this.prisma.patientClinic.update({
      where: { clinicId_patientId: { clinicId, patientId } },
      data: { notes },
    });
    return this.getById(clinicId, patientId);
  }

  async getOdontogram(clinicId: string, patientId: string) {
    await this.requirePatientLink(clinicId, patientId);
    const record = await this.prisma.dentalRecord.findUnique({
      where: { clinicId_patientId: { clinicId, patientId } },
      include: { teeth: { orderBy: { toothNumber: 'asc' } } },
    });
    return {
      teeth: (record?.teeth ?? []).map((t) => ({
        toothNumber: t.toothNumber,
        condition: mapToothCondition(t.condition),
        treatment: t.treatment ?? undefined,
        notes: t.notes ?? undefined,
      })),
    };
  }

  async updateOdontogram(
    clinicId: string,
    patientId: string,
    teeth: ToothRecordDto[],
  ) {
    await this.requirePatientLink(clinicId, patientId);

    const record = await this.prisma.$transaction(async (tx) => {
      const dental = await tx.dentalRecord.upsert({
        where: { clinicId_patientId: { clinicId, patientId } },
        create: { clinicId, patientId },
        update: {},
      });
      await tx.dentalToothRecord.deleteMany({
        where: { dentalRecordId: dental.id },
      });
      if (teeth.length) {
        await tx.dentalToothRecord.createMany({
          data: teeth.map((t) => ({
            dentalRecordId: dental.id,
            toothNumber: t.toothNumber,
            condition: mapToothConditionToPrisma(t.condition),
            treatment: t.treatment,
            notes: t.notes,
          })),
        });
      }
      return dental;
    });

    const full = await this.prisma.dentalRecord.findUnique({
      where: { id: record.id },
      include: { teeth: { orderBy: { toothNumber: 'asc' } } },
    });

    return {
      teeth: (full?.teeth ?? []).map((t) => ({
        toothNumber: t.toothNumber,
        condition: mapToothCondition(t.condition),
        treatment: t.treatment ?? undefined,
        notes: t.notes ?? undefined,
      })),
    };
  }

  private async requirePatientLink(clinicId: string, patientId: string) {
    const link = await this.prisma.patientClinic.findFirst({
      where: { clinicId, patientId, isActive: true },
      include: {
        patient: {
          include: {
            user: true,
            appointments: {
              where: {
                clinicId,
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
                startsAt: { gte: new Date() },
              },
              orderBy: { startsAt: 'asc' },
              take: 1,
            },
          },
        },
      },
    });
    if (!link) throw new AppError('NOT_FOUND', 'Patient not found', 404);
    return link;
  }

  private toPatientDto(
    link: Prisma.PatientClinicGetPayload<{
      include: {
        patient: {
          include: {
            user: true;
            appointments: true;
          };
        };
      };
    }>,
  ): PatientDto {
    const { patient } = link;
    const next = patient.appointments[0];
    return {
      id: patient.id,
      displayId: patient.displayId ?? undefined,
      fullName: `${patient.user.firstName} ${patient.user.lastName}`.trim(),
      firstName: patient.user.firstName,
      lastName: patient.user.lastName,
      phone: patient.user.phone ?? '',
      gender: mapGender(patient.gender),
      birthDate: patient.birthDate
        ? format(patient.birthDate, 'yyyy-MM-dd')
        : '',
      lastVisit: link.lastVisitAt
        ? format(link.lastVisitAt, 'yyyy-MM-dd')
        : undefined,
      nextAppointment: next ? format(next.startsAt, 'yyyy-MM-dd') : undefined,
      nextAppointmentTime: next ? format(next.startsAt, 'HH:mm') : undefined,
      status: link.isActive ? 'active' : 'inactive',
      clinicalStatus: mapClinicalStatus(link.clinicalStatus),
      notes: link.notes ?? patient.notes ?? undefined,
      avatar: patient.avatarUrl ?? undefined,
      balance: link.balanceUzs,
      visitCount: link.visitCount,
      createdAt: link.createdAt.toISOString(),
    };
  }
}
