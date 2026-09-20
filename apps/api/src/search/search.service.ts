import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async search(
    user: AuthUser,
    qRaw: string,
    type?: string,
    limit = 20,
  ) {
    const minLen = parseInt(process.env.SEARCH_MIN_LENGTH ?? '2', 10);
    const q = qRaw?.trim() ?? '';
    if (q.length < minLen) {
      throw new AppError(
        'INVALID_QUERY',
        `Query must be at least ${minLen} characters`,
        400,
      );
    }

    const isPatient = user.roles.includes('PATIENT');
    const isDoctor = user.roles.includes('DOCTOR');
    const isClinicStaff = user.roles.some((r) =>
      ['CLINIC_OWNER', 'CLINIC_ADMIN', 'RECEPTIONIST', 'ACCOUNTANT'].includes(r),
    );

    const results: Array<{
      type: string;
      id: string;
      title: string;
      subtitle?: string;
    }> = [];

    const want = (t: string) => !type || type === t || type === 'all';

    if (isPatient || (!isDoctor && !isClinicStaff)) {
      if (want('clinics')) {
        const clinics = await this.prisma.clinic.findMany({
          where: {
            isMarketplaceVisible: true,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
              { slug: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: { id: true, name: true, phone: true },
        });
        results.push(
          ...clinics.map((c) => ({
            type: 'clinic',
            id: c.id,
            title: c.name,
            subtitle: c.phone ?? undefined,
          })),
        );
      }
      if (want('doctors')) {
        const doctors = await this.prisma.doctorProfile.findMany({
          where: {
            isActive: true,
            OR: [
              { specialty: { contains: q, mode: 'insensitive' } },
              {
                user: {
                  OR: [
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          },
          take: limit,
          include: { user: true },
        });
        results.push(
          ...doctors.map((d) => ({
            type: 'doctor',
            id: d.id,
            title: `${d.user.firstName} ${d.user.lastName}`.trim(),
            subtitle: d.specialty ?? undefined,
          })),
        );
      }
      if (want('services')) {
        const services = await this.prisma.service.findMany({
          where: { name: { contains: q, mode: 'insensitive' }, isActive: true },
          take: limit,
        });
        results.push(
          ...services.map((s) => ({
            type: 'service',
            id: s.id,
            title: s.name,
            subtitle: s.category ?? undefined,
          })),
        );
      }
    }

    if (isDoctor || isClinicStaff) {
      const clinicId = user.clinicId;
      if (clinicId && want('patients')) {
        const patients = await this.prisma.patientClinic.findMany({
          where: {
            clinicId,
            isActive: true,
            patient: {
              OR: [
                { displayId: { contains: q, mode: 'insensitive' } },
                {
                  user: {
                    OR: [
                      { firstName: { contains: q, mode: 'insensitive' } },
                      { lastName: { contains: q, mode: 'insensitive' } },
                      { phone: { contains: q } },
                    ],
                  },
                },
              ],
            },
          },
          take: limit,
          include: { patient: { include: { user: true } } },
        });
        results.push(
          ...patients.map((p) => ({
            type: 'patient',
            id: p.patientId,
            title: `${p.patient.user.firstName} ${p.patient.user.lastName}`.trim(),
            subtitle: p.patient.user.phone ?? p.patient.displayId ?? undefined,
          })),
        );
      }
      if (clinicId && want('appointments')) {
        const appointments = await this.prisma.appointment.findMany({
          where: {
            clinicId,
            OR: [
              { patientName: { contains: q, mode: 'insensitive' } },
              { doctorName: { contains: q, mode: 'insensitive' } },
              { serviceName: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: limit,
          orderBy: { startsAt: 'desc' },
        });
        results.push(
          ...appointments.map((a) => ({
            type: 'appointment',
            id: a.id,
            title: a.patientName,
            subtitle: `${a.doctorName} · ${a.serviceName}`,
          })),
        );
      }
      if (isClinicStaff && clinicId && want('doctors')) {
        const doctors = await this.prisma.doctorClinic.findMany({
          where: {
            clinicId,
            isActive: true,
            doctor: {
              OR: [
                { specialty: { contains: q, mode: 'insensitive' } },
                {
                  user: {
                    OR: [
                      { firstName: { contains: q, mode: 'insensitive' } },
                      { lastName: { contains: q, mode: 'insensitive' } },
                    ],
                  },
                },
              ],
            },
          },
          take: limit,
          include: { doctor: { include: { user: true } } },
        });
        results.push(
          ...doctors.map((d) => ({
            type: 'doctor',
            id: d.doctorId,
            title: `${d.doctor.user.firstName} ${d.doctor.user.lastName}`.trim(),
            subtitle: d.doctor.specialty ?? undefined,
          })),
        );
      }
    }

    return { q, results: results.slice(0, limit) };
  }
}
