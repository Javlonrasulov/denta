import { Injectable, Optional } from '@nestjs/common';
import {
  AppointmentSource,
  AppointmentStatus,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { addMinutes, parseISO } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.module';
import { RealtimeService } from '../realtime/realtime.service';
import { generateTimeSlots } from '../slots/slot-generator';
import {
  CancelAppointmentDto,
  CreateAppointmentDto,
  GetSlotsQueryDto,
  ListAppointmentsQueryDto,
  RescheduleAppointmentDto,
} from './dto/appointments.dto';

/** Frontend AppointmentStatus mapping */
export type FrontendAppointmentStatus =
  | 'upcoming'
  | 'completed'
  | 'cancelled';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Optional() private readonly realtime?: RealtimeService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  async getSlots(query: GetSlotsQueryDto) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: query.doctorId },
      include: { schedules: true },
    });
    if (!doctor) throw new AppError('NOT_FOUND', 'Doctor not found', 404);

    const date = parseISO(query.date);
    const dayOfWeek = date.getUTCDay(); // will adjust with clinic TZ below

    const clinic = query.clinicId
      ? await this.prisma.clinic.findUnique({ where: { id: query.clinicId } })
      : await this.prisma.doctorClinic
          .findFirst({
            where: { doctorId: doctor.id, isActive: true },
            include: { clinic: true },
          })
          .then((l) => l?.clinic ?? null);

    const tz = clinic?.timezone ?? 'Asia/Tashkent';
    const localDay = toZonedTime(parseISO(`${query.date}T12:00:00`), tz).getDay();

    const schedule =
      doctor.schedules.find((s) => s.dayOfWeek === localDay && s.isActive) ??
      null;

    const workingHours = schedule
      ? { start: schedule.startTime, end: schedule.endTime }
      : { start: '09:00', end: '18:00' };
    const breakTime =
      schedule?.breakStart && schedule?.breakEnd
        ? { start: schedule.breakStart, end: schedule.breakEnd }
        : { start: '13:00', end: '14:00' };
    const duration =
      (query.serviceId
        ? (
            await this.prisma.clinicService.findFirst({
              where: {
                serviceId: query.serviceId,
                isActive: true,
                ...(query.clinicId ? { clinicId: query.clinicId } : {}),
                clinic: {
                  doctorLinks: { some: { doctorId: doctor.id, isActive: true } },
                },
              },
            })
          )?.durationMinutes
        : undefined) ??
      schedule?.slotDuration ??
      doctor.appointmentDurationMinutes ??
      30;

    if (schedule === null && doctor.schedules.length > 0) {
      // Explicit closed day
      return [];
    }

    const dayStart = fromZonedTime(`${query.date}T00:00:00`, tz);
    const dayEnd = fromZonedTime(`${query.date}T23:59:59`, tz);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        startsAt: { gte: dayStart, lte: dayEnd },
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      },
    });

    const bookings = appointments.map((a) => {
      const local = toZonedTime(a.startsAt, tz);
      const hh = String(local.getHours()).padStart(2, '0');
      const mm = String(local.getMinutes()).padStart(2, '0');
      return {
        date: query.date,
        time: `${hh}:${mm}`,
        status: a.status,
      };
    });

    return generateTimeSlots({
      workingHours,
      breakTime,
      durationMinutes: duration,
      date: query.date,
      bookings,
    });
  }

  async create(dto: CreateAppointmentDto, actor: AuthUser | string) {
    const actorUserId = typeof actor === 'string' ? actor : actor.id;
    const actorClinicId = typeof actor === 'string' ? null : actor.clinicId;
    const actorRoles = typeof actor === 'string' ? [] : actor.roles ?? [];

    const isStaff = actorRoles.some((r) =>
      ['CLINIC_OWNER', 'CLINIC_ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'DOCTOR'].includes(
        r,
      ),
    );
    if (isStaff) {
      if (!actorClinicId) {
        throw new AppError('UNAUTHORIZED', 'No clinic context', 401);
      }
      if (dto.clinicId !== actorClinicId) {
        throw new AppError(
          'FORBIDDEN',
          'Cannot create appointment for another clinic',
          403,
        );
      }
    }

    const lockKey = `lock:slot:${dto.doctorId}:${dto.date}:${dto.time}`;
    const lockToken = randomUUID();
    const acquired = await this.redis.acquireLock(lockKey, 10_000, lockToken);
    if (!acquired) {
      throw new AppError(
        'SLOT_TAKEN',
        'This time slot is no longer available',
        409,
      );
    }

    try {
      return await this.createInsideLock(dto, actorUserId);
    } finally {
      await this.redis.releaseLock(lockKey, lockToken);
    }
  }

  private async createInsideLock(
    dto: CreateAppointmentDto,
    actorUserId: string,
  ) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
      include: { user: true },
    });
    if (!doctor) throw new AppError('NOT_FOUND', 'Doctor not found', 404);

    const clinic = await this.prisma.clinic.findUnique({
      where: { id: dto.clinicId },
      include: {
        branches: {
          where: { isActive: true },
          orderBy: [{ isPrimary: 'desc' }],
          take: 1,
        },
      },
    });
    if (!clinic) throw new AppError('NOT_FOUND', 'Clinic not found', 404);

    // Nested ID must belong to the target clinic (never trust doctorId alone).
    const doctorAtClinic = await this.prisma.doctorClinic.findFirst({
      where: {
        doctorId: doctor.id,
        clinicId: clinic.id,
        isActive: true,
      },
    });
    if (!doctorAtClinic) {
      throw new AppError(
        'FORBIDDEN',
        'Doctor is not active at this clinic',
        403,
      );
    }

    const branch =
      (dto.branchId
        ? await this.prisma.clinicBranch.findFirst({
            where: { id: dto.branchId, clinicId: clinic.id },
          })
        : clinic.branches[0]) ?? null;

    const tz = branch?.timezone ?? clinic.timezone ?? 'Asia/Tashkent';
    const startsAt = fromZonedTime(`${dto.date}T${dto.time}:00`, tz);

    if (!dto.serviceId) {
      throw new AppError(
        'VALIDATION_ERROR',
        'serviceId is required for booking',
        400,
      );
    }

    const clinicService = await this.prisma.clinicService.findFirst({
      where: {
        clinicId: clinic.id,
        serviceId: dto.serviceId,
        isActive: true,
      },
      include: { service: true },
    });
    if (!clinicService) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Selected service is not available at this clinic',
        400,
      );
    }

    // Prefer doctor-service assignment when present; otherwise clinic service is enough.
    const doctorOffers = await this.prisma.doctorService.findFirst({
      where: {
        doctorId: doctor.id,
        serviceId: dto.serviceId,
        isActive: true,
      },
    });
    if (!doctorOffers) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Selected service is not offered by this doctor',
        400,
      );
    }

    const duration = clinicService.durationMinutes;
    const priceUzs = clinicService.priceUzs;
    const serviceName =
      clinicService.customName?.trim() || clinicService.service.name;

    const endsAt = addMinutes(startsAt, duration);

    // Resolve patient
    let patientId = dto.patientId;
    if (!patientId) {
      const profile = await this.prisma.patientProfile.findUnique({
        where: { userId: actorUserId },
      });
      if (!profile) {
        throw new AppError(
          'NOT_FOUND',
          'Patient profile required — create patient profile first',
          400,
        );
      }
      patientId = profile.id;
    }

    const patient = await this.prisma.patientProfile.findUnique({
      where: { id: patientId },
      include: { user: true },
    });
    if (!patient) throw new AppError('NOT_FOUND', 'Patient not found', 404);

    // Staff must pass a patient already linked to this clinic (no silent cross-clinic attach).
    // Marketplace/client self-book can create the PatientClinic link below.
    const actorIsSelfPatient = patient.userId === actorUserId;
    const existingPatientLink = await this.prisma.patientClinic.findFirst({
      where: {
        clinicId: clinic.id,
        patientId: patient.id,
        isActive: true,
      },
    });
    if (!actorIsSelfPatient && !existingPatientLink) {
      throw new AppError(
        'FORBIDDEN',
        'Patient does not belong to this clinic',
        403,
      );
    }

    const patientName =
      `${patient.user.firstName} ${patient.user.lastName}`.trim();
    const doctorName =
      `${doctor.user.firstName} ${doctor.user.lastName}`.trim();

    try {
      const appointment = await this.prisma.$transaction(async (tx) => {
        const created = await tx.appointment.create({
          data: {
            clinicId: clinic.id,
            branchId: branch?.id,
            doctorId: doctor.id,
            patientId: patient.id,
            serviceId: dto.serviceId,
            startsAt,
            endsAt,
            status: AppointmentStatus.PENDING,
            priceUzs,
            notes: dto.notes,
            source: dto.source ?? AppointmentSource.CLIENT_APP,
            patientName,
            doctorName,
            clinicName: clinic.name,
            clinicAddress: branch?.address ?? '',
            serviceName,
          },
        });

        await tx.bookingSlotLock.create({
          data: {
            doctorId: doctor.id,
            startsAt,
            appointmentId: created.id,
          },
        });

        await tx.appointmentStatusHistory.create({
          data: {
            appointmentId: created.id,
            toStatus: AppointmentStatus.PENDING,
            changedById: actorUserId,
          },
        });

        await tx.patientClinic.upsert({
          where: {
            clinicId_patientId: {
              clinicId: clinic.id,
              patientId: patient.id,
            },
          },
          create: {
            clinicId: clinic.id,
            patientId: patient.id,
          },
          update: {},
        });

        return created;
      });

      const frontend = this.toFrontend(appointment, tz);
      this.realtime?.emitAppointmentCreated(frontend);
      this.realtime?.emitSlotUpdated(doctor.id, {
        doctorId: doctor.id,
        date: dto.date,
      });
      void this.notifications?.notifyClinicStaff(clinic.id, {
        type: 'APPOINTMENT_CREATED',
        title: 'New appointment',
        body: `${patientName} · ${dto.date} ${dto.time} · ${serviceName}`,
        data: { appointmentId: appointment.id, clinicId: clinic.id },
      });
      if (doctor.userId) {
        void this.notifications?.create({
          userId: doctor.userId,
          type: 'APPOINTMENT_CREATED',
          title: 'New appointment',
          body: `${patientName} · ${dto.date} ${dto.time}`,
          data: { appointmentId: appointment.id },
        });
      }
      return frontend;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new AppError(
          'SLOT_TAKEN',
          'This time slot is no longer available',
          409,
        );
      }
      throw err;
    }
  }

  async list(query: ListAppointmentsQueryDto, user: AuthUser) {
    const where: Prisma.AppointmentWhereInput = {};
    const clinicRoles = [
      'CLINIC_OWNER',
      'CLINIC_ADMIN',
      'RECEPTIONIST',
      'ACCOUNTANT',
      'DENTA_SUPER_ADMIN',
    ];
    const isClinicStaff = user.roles.some((r) => clinicRoles.includes(r));
    const isPatient = user.roles.includes('PATIENT');
    const isDoctor = user.roles.includes('DOCTOR');

    if (isPatient) {
      const profile = await this.prisma.patientProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile) return [];
      where.patientId = profile.id;
    } else if (isDoctor && !isClinicStaff) {
      const doctor = await this.prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });
      if (!doctor) return [];
      where.doctorId = doctor.id;
      // Multi-clinic doctors must only see the active workspace clinic.
      if (user.clinicId) where.clinicId = user.clinicId;
    } else if (user.clinicId) {
      where.clinicId = user.clinicId;
      if (query.doctorId) where.doctorId = query.doctorId;
    } else if (query.doctorId) {
      where.doctorId = query.doctorId;
    }

    if (query.date) {
      const start = parseISO(`${query.date}T00:00:00.000Z`);
      const end = parseISO(`${query.date}T23:59:59.999Z`);
      where.startsAt = { gte: start, lte: end };
    }
    if (query.status) {
      const mapped = this.fromFrontendStatus(query.status);
      if (mapped.length) where.status = { in: mapped };
    }

    const rows = await this.prisma.appointment.findMany({
      where,
      include: { charge: true },
      orderBy: { startsAt: 'asc' },
      take: 200,
    });
    return rows.map((r) => {
      const base = this.toFrontend(r);
      const charge = r.charge
        ? {
            id: r.charge.id,
            amount: r.charge.amountUzs,
            paidAmount: r.charge.paidAmountUzs,
            remainingAmount: r.charge.remainingUzs,
            status: this.mapChargeStatus(r.charge.status),
          }
        : null;
      return {
        ...base,
        serviceId: r.serviceId ?? undefined,
        charge,
        paymentStatus: charge?.status ?? null,
      };
    });
  }

  async getById(id: string, user?: AuthUser) {
    const row = await this.prisma.appointment.findUnique({
      where: { id },
      include: { charge: true },
    });
    if (!row) throw new AppError('NOT_FOUND', 'Appointment not found', 404);

    if (user) {
      const isPatient = user.roles.includes('PATIENT');
      const isDoctor = user.roles.includes('DOCTOR');
      const isClinicStaff = user.roles.some((r) =>
        ['CLINIC_OWNER', 'CLINIC_ADMIN', 'RECEPTIONIST', 'ACCOUNTANT'].includes(
          r,
        ),
      );
      if (isPatient) {
        const profile = await this.prisma.patientProfile.findUnique({
          where: { userId: user.id },
        });
        if (!profile || profile.id !== row.patientId) {
          throw new AppError('FORBIDDEN', 'Access denied', 403);
        }
      } else if (isDoctor && !isClinicStaff) {
        const doctor = await this.prisma.doctorProfile.findUnique({
          where: { userId: user.id },
        });
        if (!doctor || doctor.id !== row.doctorId) {
          throw new AppError('FORBIDDEN', 'Access denied', 403);
        }
      } else if (isClinicStaff) {
        if (!user.clinicId || user.clinicId !== row.clinicId) {
          throw new AppError('FORBIDDEN', 'Access denied', 403);
        }
      }
    }

    const base = this.toFrontend(row);
    const charge = row.charge
      ? {
          id: row.charge.id,
          amount: row.charge.amountUzs,
          paidAmount: row.charge.paidAmountUzs,
          remainingAmount: row.charge.remainingUzs,
          status: this.mapChargeStatus(row.charge.status),
        }
      : null;

    return {
      ...base,
      serviceId: row.serviceId ?? undefined,
      charge,
      paymentStatus: charge?.status ?? null,
    };
  }

  private mapChargeStatus(
    status: string,
  ): 'unpaid' | 'partially_paid' | 'paid' | 'cancelled' {
    switch (status) {
      case 'PARTIALLY_PAID':
        return 'partially_paid';
      case 'PAID':
        return 'paid';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'unpaid';
    }
  }

  async cancel(id: string, actorUserId: string, dto: CancelAppointmentDto) {
    const row = await this.prisma.appointment.findUnique({ where: { id } });
    if (!row) throw new AppError('NOT_FOUND', 'Appointment not found', 404);
    if (
      row.status === AppointmentStatus.CANCELLED ||
      row.status === AppointmentStatus.COMPLETED
    ) {
      throw new AppError('UNKNOWN', 'Cannot cancel this appointment', 400);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.CANCELLED,
          notes: dto.reason
            ? `${row.notes ?? ''}\nCancel: ${dto.reason}`.trim()
            : row.notes,
        },
      });
      await tx.bookingSlotLock.deleteMany({
        where: { appointmentId: id },
      });
      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: id,
          fromStatus: row.status,
          toStatus: AppointmentStatus.CANCELLED,
          changedById: actorUserId,
          note: dto.reason,
        },
      });
    });

    const frontend = await this.getById(id);
    this.realtime?.emitAppointmentCancelled(frontend);
    this.realtime?.emitSlotUpdated(frontend.doctorId, {
      doctorId: frontend.doctorId,
      date: frontend.date,
    });
    return frontend;
  }

  async reschedule(
    id: string,
    actorUserId: string,
    dto: RescheduleAppointmentDto,
  ) {
    const row = await this.prisma.appointment.findUnique({ where: { id } });
    if (!row) throw new AppError('NOT_FOUND', 'Appointment not found', 404);
    if (
      row.status === AppointmentStatus.CANCELLED ||
      row.status === AppointmentStatus.COMPLETED
    ) {
      throw new AppError('UNKNOWN', 'Cannot reschedule this appointment', 400);
    }

    const lockKey = `lock:slot:${row.doctorId}:${dto.date}:${dto.time}`;
    const lockToken = randomUUID();
    const acquired = await this.redis.acquireLock(lockKey, 10_000, lockToken);
    if (!acquired) {
      throw new AppError(
        'SLOT_TAKEN',
        'This time slot is no longer available',
        409,
      );
    }

    try {
      const clinic = await this.prisma.clinic.findUnique({
        where: { id: row.clinicId },
        include: {
          branches: {
            where: { isActive: true },
            orderBy: [{ isPrimary: 'desc' }],
            take: 1,
          },
        },
      });
      if (!clinic) throw new AppError('NOT_FOUND', 'Clinic not found', 404);
      const branch =
        (row.branchId
          ? await this.prisma.clinicBranch.findFirst({
              where: { id: row.branchId, clinicId: clinic.id },
            })
          : clinic.branches[0]) ?? null;
      const tz = branch?.timezone ?? clinic.timezone ?? 'Asia/Tashkent';
      const startsAt = fromZonedTime(`${dto.date}T${dto.time}:00`, tz);
      const durationMs = row.endsAt.getTime() - row.startsAt.getTime();
      const endsAt = new Date(startsAt.getTime() + Math.max(durationMs, 15 * 60_000));

      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.bookingSlotLock.deleteMany({
            where: { appointmentId: id },
          });
          await tx.appointment.update({
            where: { id },
            data: { startsAt, endsAt },
          });
          await tx.bookingSlotLock.create({
            data: {
              doctorId: row.doctorId,
              startsAt,
              appointmentId: id,
            },
          });
          await tx.appointmentStatusHistory.create({
            data: {
              appointmentId: id,
              fromStatus: row.status,
              toStatus: row.status,
              changedById: actorUserId,
              note: `Rescheduled to ${dto.date} ${dto.time}`,
            },
          });
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          throw new AppError(
            'SLOT_TAKEN',
            'This time slot is no longer available',
            409,
          );
        }
        throw err;
      }

      const frontend = await this.getById(id);
      this.realtime?.emitAppointmentUpdated(frontend);
      this.realtime?.emitSlotUpdated(row.doctorId, {
        doctorId: row.doctorId,
        date: dto.date,
      });
      return frontend;
    } finally {
      await this.redis.releaseLock(lockKey, lockToken);
    }
  }

  async updateStatus(
    id: string,
    user: AuthUser,
    status: 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CONFIRMED',
  ) {
    const row = await this.prisma.appointment.findUnique({ where: { id } });
    if (!row) throw new AppError('NOT_FOUND', 'Appointment not found', 404);

    if (user.roles.includes('DOCTOR') && !user.roles.some((r) =>
      ['CLINIC_OWNER', 'CLINIC_ADMIN', 'RECEPTIONIST'].includes(r),
    )) {
      const doctor = await this.prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });
      if (!doctor || doctor.id !== row.doctorId) {
        throw new AppError('FORBIDDEN', 'Access denied', 403);
      }
    } else if (user.clinicId && user.clinicId !== row.clinicId) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }

    const next = AppointmentStatus[status];
    if (!next) throw new AppError('UNKNOWN', 'Invalid status', 400);

    await this.prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: { status: next },
      });
      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: id,
          fromStatus: row.status,
          toStatus: next,
          changedById: user.id,
        },
      });
      if (next === AppointmentStatus.COMPLETED) {
        await tx.patientClinic.updateMany({
          where: { clinicId: row.clinicId, patientId: row.patientId },
          data: { lastVisitAt: new Date() },
        });

        // Idempotent receivable: unique appointmentId prevents double charge
        const existing = await tx.appointmentCharge.findUnique({
          where: { appointmentId: id },
        });
        if (!existing) {
          const amount = Math.max(0, row.priceUzs);
          try {
            await tx.appointmentCharge.create({
              data: {
                clinicId: row.clinicId,
                patientId: row.patientId,
                appointmentId: id,
                serviceId: row.serviceId,
                doctorId: row.doctorId,
                amountUzs: amount,
                paidAmountUzs: 0,
                remainingUzs: amount,
                status: 'UNPAID',
                patientName: row.patientName,
                doctorName: row.doctorName,
                serviceName: row.serviceName,
              },
            });
          } catch (err) {
            // Race: unique constraint — treat as success
            if (
              !(
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === 'P2002'
              )
            ) {
              throw err;
            }
          }
        }
      }
    });

    const frontend = await this.getById(id, user);
    this.realtime?.emitAppointmentUpdated(frontend);
    return frontend;
  }

  private toFrontend(
    row: {
      id: string;
      doctorId: string;
      clinicId: string;
      patientId: string;
      patientName: string;
      doctorName: string;
      clinicName: string;
      clinicAddress: string;
      serviceName: string;
      startsAt: Date;
      status: AppointmentStatus;
      priceUzs: number;
      notes: string | null;
    },
    tz = 'Asia/Tashkent',
  ) {
    const local = toZonedTime(row.startsAt, tz);
    const y = local.getFullYear();
    const m = String(local.getMonth() + 1).padStart(2, '0');
    const d = String(local.getDate()).padStart(2, '0');
    const hh = String(local.getHours()).padStart(2, '0');
    const mm = String(local.getMinutes()).padStart(2, '0');

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
      status: this.toFrontendStatus(row.status),
      price: row.priceUzs,
      notes: row.notes ?? undefined,
    };
  }

  private toFrontendStatus(
    status: AppointmentStatus,
  ): FrontendAppointmentStatus {
    switch (status) {
      case AppointmentStatus.COMPLETED:
        return 'completed';
      case AppointmentStatus.CANCELLED:
      case AppointmentStatus.NO_SHOW:
        return 'cancelled';
      default:
        return 'upcoming';
    }
  }

  private fromFrontendStatus(status: string): AppointmentStatus[] {
    switch (status) {
      case 'completed':
        return [AppointmentStatus.COMPLETED];
      case 'cancelled':
        return [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW];
      case 'upcoming':
        return [
          AppointmentStatus.PENDING,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.IN_PROGRESS,
        ];
      default:
        return [];
    }
  }
}
