import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppointmentStatus,
  InvitationStatus,
  PermissionEffect,
  UserRole,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { AuditService } from '../common/audit/audit.service';
import { AppError } from '../common/filters/global-exception.filter';
import {
  ALL_MANAGEABLE_PERMISSIONS,
  ASSIGNABLE_STAFF_ROLES,
  expandEffectivePermissions,
} from '../common/permissions/permissions';
import { isValidPassword } from '../common/utils/password.util';
import {
  isValidEmail,
  normalizeEmail,
  normalizePhone,
} from '../common/utils/phone.util';
import { DEFAULT_SLOT_MINUTES, type ScheduleDay } from '../doctors/schedule.util';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AcceptInvitationDto,
  CreateMemberDto,
  LookupMemberDto,
  UpdateMemberDto,
  UpdateMemberPermissionsDto,
} from './dto/members.dto';
import type { Prisma } from '@prisma/client';

const DEFAULT_SCHEDULE = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotDuration: 30 },
  { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotDuration: 30 },
  { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotDuration: 30 },
  { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotDuration: 30 },
  { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotDuration: 30 },
];

/** Initial password for doctors created by the clinic; they must change it in the doctor app. */
export const DEFAULT_DOCTOR_PASSWORD = '123456';

/** Doctor-specific settings applied when linking a doctor to a clinic. */
type DoctorLinkOptions = {
  experienceYears?: number;
  schedule?: ScheduleDay[];
  slotDuration?: number;
};

export type CreateDoctorAccountInput = {
  firstName: string;
  lastName: string;
  /** Either a phone number or an existing user picked from a lookup. */
  phone?: string;
  existingUserId?: string;
  email?: string;
  specialty: string;
  experienceYears?: number;
  serviceIds?: string[];
  schedule?: ScheduleDay[];
  slotDuration?: number;
};

export type UpdateDoctorAccountInput = {
  firstName?: string;
  lastName?: string;
  specialty?: string;
  experienceYears?: number;
  priceFrom?: number;
  schedule?: ScheduleDay[];
  slotDuration?: number;
};

export type DoctorLookupMatch = {
  userId: string;
  firstName: string;
  lastName: string;
  phoneMasked: string;
  isDoctor: boolean;
  photoUrl: string | null;
  specialty: string | null;
  experienceYears: number;
  /** Active member of the requesting clinic already. */
  alreadyHere: boolean;
  clinics: {
    clinicId: string;
    clinicName: string;
    isThisClinic: boolean;
    current: boolean;
    startedAt: string;
    endedAt: string | null;
    schedule: ScheduleDay[];
  }[];
};

function maskPhone(phone: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return phone;
  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} *** ** ${digits.slice(-2)}`;
}

function maskName(firstName: string, lastName: string): string {
  const last = lastName.trim();
  const initial = last ? `${last.charAt(0).toUpperCase()}.` : '';
  return `${firstName.trim()} ${initial}`.trim();
}

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async list(clinicId: string) {
    const rows = await this.prisma.clinicMember.findMany({
      where: { clinicId },
      include: {
        user: true,
        permissions: true,
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((m) => this.toMemberDto(m));
  }

  async getOne(clinicId: string, membershipId: string) {
    const m = await this.requireMember(clinicId, membershipId);
    return this.toMemberDto(m);
  }

  async lookupExisting(clinicId: string, dto: LookupMemberDto) {
    const phone = dto.phone ? normalizePhone(dto.phone) : null;
    const email = dto.email ? normalizeEmail(dto.email) : null;
    if (!phone && !email) {
      throw new AppError('VALIDATION_ERROR', 'phone or email required', 400);
    }
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(phone ? [{ phone }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
    });
    if (!user) return { existingUser: false as const };

    const already = await this.prisma.clinicMember.findUnique({
      where: { clinicId_userId: { clinicId, userId: user.id } },
    });
    return {
      existingUser: true as const,
      displayName: maskName(user.firstName, user.lastName),
      alreadyMember: Boolean(already),
      alreadyActive: Boolean(already?.isActive),
    };
  }

  async createOrInvite(clinicId: string, actorUserId: string, dto: CreateMemberDto) {
    this.assertAssignableRole(dto.role);
    const phone = normalizePhone(dto.phone);
    if (!phone) throw new AppError('INVALID_PHONE', 'Invalid phone', 400);
    const email = dto.email ? normalizeEmail(dto.email) : null;
    if (dto.email && (!email || !isValidEmail(email))) {
      throw new AppError('INVALID_EMAIL', 'Invalid email', 400);
    }
    if (dto.role === UserRole.DOCTOR && !dto.specialty?.trim()) {
      throw new AppError('VALIDATION_ERROR', 'specialty required for doctors', 400);
    }
    await this.assertGrantable(clinicId, actorUserId, dto.permissions, dto.role);

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
      include: { doctorProfile: true },
    });

    if (existing) {
      await this.assertNotActiveMember(clinicId, existing.id);
      // Email present → confirmation invite (never reset password).
      // Phone-only → attach membership immediately.
      if (email) {
        return this.createInvitation(clinicId, actorUserId, {
          ...dto,
          phone,
          email,
          existingUserId: existing.id,
        });
      }
      return this.attachExistingUser(clinicId, actorUserId, existing, dto);
    }

    // New user → invitation (email preferred) or temp password for phone-only
    if (email) {
      return this.createInvitation(clinicId, actorUserId, {
        ...dto,
        phone,
        email,
      });
    }

    return this.createNewUserWithTempPassword(clinicId, actorUserId, {
      ...dto,
      phone,
      email: email ?? undefined,
    });
  }

  /**
   * Doctors log into the mobile app with their phone number. New accounts get
   * DEFAULT_DOCTOR_PASSWORD and must change it; existing users keep their password.
   */
  async createDoctorAccount(
    clinicId: string,
    actorUserId: string,
    input: CreateDoctorAccountInput,
  ) {
    const linkOptions: DoctorLinkOptions = {
      experienceYears: input.experienceYears,
      schedule: input.schedule,
      slotDuration: input.slotDuration,
    };

    if (input.existingUserId) {
      const picked = await this.prisma.user.findUnique({
        where: { id: input.existingUserId },
        include: { doctorProfile: true },
      });
      if (!picked) throw new AppError('NOT_FOUND', 'User not found', 404);
      await this.assertNotActiveMember(clinicId, picked.id);
      const result = await this.attachExistingUser(
        clinicId,
        actorUserId,
        picked,
        {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: picked.phone ?? '',
          role: UserRole.DOCTOR,
          specialty: input.specialty.trim(),
          serviceIds: input.serviceIds,
        },
        linkOptions,
      );
      return { ...result, login: picked.phone ?? '' };
    }

    const phone = normalizePhone(input.phone ?? '');
    if (!phone) throw new AppError('INVALID_PHONE', 'Invalid phone', 400);
    const email = input.email?.trim() ? normalizeEmail(input.email) : null;
    if (email && !isValidEmail(email)) {
      throw new AppError('INVALID_EMAIL', 'Invalid email', 400);
    }
    const specialty = input.specialty.trim();
    if (!specialty) {
      throw new AppError('VALIDATION_ERROR', 'specialty required for doctors', 400);
    }

    const dto: CreateMemberDto = {
      firstName: input.firstName,
      lastName: input.lastName,
      phone,
      email: email ?? undefined,
      role: UserRole.DOCTOR,
      specialty,
      serviceIds: input.serviceIds,
    };

    const existing = await this.prisma.user.findUnique({
      where: { phone },
      include: { doctorProfile: true },
    });

    if (existing) {
      await this.assertNotActiveMember(clinicId, existing.id);
      const result = await this.attachExistingUser(
        clinicId,
        actorUserId,
        existing,
        dto,
        linkOptions,
      );
      return { ...result, login: phone };
    }

    if (email) {
      const emailOwner = await this.prisma.user.findUnique({ where: { email } });
      if (emailOwner) throw new AppError('EMAIL_TAKEN', 'Email already registered', 409);
    }

    const created = await this.createNewUserWithTempPassword(
      clinicId,
      actorUserId,
      { ...dto, phone },
      { password: DEFAULT_DOCTOR_PASSWORD, ...linkOptions },
    );
    return { ...created, login: phone };
  }

  private async assertNotActiveMember(clinicId: string, userId: string) {
    const membership = await this.prisma.clinicMember.findUnique({
      where: { clinicId_userId: { clinicId, userId } },
    });
    if (membership?.isActive) {
      throw new AppError('ALREADY_MEMBER', 'User is already a clinic member', 409);
    }
  }

  /**
   * Overrides must name known permissions, and a non-owner may only hand out
   * access (or the admin role) they hold themselves.
   */
  private async assertGrantable(
    clinicId: string,
    actorUserId: string,
    overrides: { permission: string; effect: PermissionEffect }[] = [],
    role?: UserRole,
  ) {
    const known = new Set<string>(ALL_MANAGEABLE_PERMISSIONS);
    const unknown = overrides.find((o) => !known.has(o.permission));
    if (unknown) {
      throw new AppError('INVALID_PERMISSION', `Unknown permission: ${unknown.permission}`, 400, {
        permission: unknown.permission,
      });
    }

    const actor = await this.prisma.clinicMember.findUnique({
      where: { clinicId_userId: { clinicId, userId: actorUserId } },
      include: { permissions: true },
    });
    if (!actor || actor.role === UserRole.CLINIC_OWNER) return;
    if (role === UserRole.CLINIC_ADMIN) {
      throw new AppError('FORBIDDEN', 'Only the clinic owner can assign administrators', 403);
    }
    const held = expandEffectivePermissions([actor.role], actor.permissions);
    const missing = overrides.find((o) => o.effect === PermissionEffect.ALLOW && !held.has(o.permission));
    if (missing) {
      throw new AppError('PERMISSION_NOT_GRANTABLE', 'Cannot grant a permission you do not have', 403, {
        permission: missing.permission,
      });
    }
  }

  /** Owner access is fixed, and nobody may change their own role, access or status. */
  private assertManageable(
    member: { role: UserRole; userId: string },
    actorUserId: string,
  ) {
    if (member.role === UserRole.CLINIC_OWNER) {
      throw new AppError('FORBIDDEN', 'Cannot change the clinic owner', 403);
    }
    if (member.userId === actorUserId) {
      throw new AppError('SELF_MODIFY', 'Cannot change your own membership', 403);
    }
  }

  /**
   * Finds people a clinic may be about to add as a doctor: by phone (any account) or by
   * exact first + last name (doctors only). Returns their clinic history and current schedules.
   */
  async lookupDoctor(
    clinicId: string,
    query: { phone?: string; firstName?: string; lastName?: string },
  ): Promise<DoctorLookupMatch[]> {
    const phone = query.phone ? normalizePhone(query.phone) : null;
    const firstName = query.firstName?.trim();
    const lastName = query.lastName?.trim();

    const include = {
      doctorProfile: {
        include: {
          clinics: {
            include: {
              clinic: { select: { id: true, name: true } },
              schedules: { where: { isActive: true }, orderBy: { dayOfWeek: 'asc' as const } },
            },
            orderBy: { startedAt: 'desc' as const },
          },
        },
      },
      clinicMemberships: { where: { clinicId }, take: 1 },
    };

    let users;
    if (phone) {
      const user = await this.prisma.user.findUnique({ where: { phone }, include });
      users = user ? [user] : [];
    } else if (firstName && lastName && firstName.length >= 2 && lastName.length >= 2) {
      users = await this.prisma.user.findMany({
        where: {
          firstName: { equals: firstName, mode: 'insensitive' },
          lastName: { equals: lastName, mode: 'insensitive' },
          doctorProfile: { isNot: null },
        },
        include,
        take: 5,
      });
    } else {
      return [];
    }

    return users.map((u) => {
      const profile = u.doctorProfile;
      const byClinic = new Map<string, DoctorLookupMatch['clinics'][number]>();
      for (const link of profile?.clinics ?? []) {
        const prev = byClinic.get(link.clinicId);
        const entry = {
          clinicId: link.clinicId,
          clinicName: link.clinic.name,
          isThisClinic: link.clinicId === clinicId,
          current: link.isActive,
          startedAt: link.startedAt.toISOString(),
          endedAt: link.endedAt?.toISOString() ?? null,
          schedule: link.isActive
            ? link.schedules.map((s) => ({
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                breakStart: s.breakStart,
                breakEnd: s.breakEnd,
              }))
            : [],
        };
        if (!prev || (entry.current && !prev.current)) byClinic.set(link.clinicId, entry);
      }
      const membership = u.clinicMemberships[0];
      return {
        userId: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        phoneMasked: maskPhone(u.phone),
        isDoctor: Boolean(profile),
        photoUrl: profile?.avatarUrl ?? null,
        specialty: profile?.specialty ?? null,
        experienceYears: profile?.experienceYears ?? 0,
        alreadyHere: Boolean(membership?.isActive),
        clinics: [...byClinic.values()].sort(
          (a, b) => Number(b.current) - Number(a.current) || b.startedAt.localeCompare(a.startedAt),
        ),
      };
    });
  }

  /**
   * Removes the doctor from this clinic only; the account, profile and history stay so
   * another clinic (or this one later) can add them again.
   */
  async removeDoctorFromClinic(
    clinicId: string,
    actorUserId: string,
    doctorId: string,
    force: boolean,
  ) {
    const doctor = await this.requireClinicDoctor(clinicId, doctorId);
    const membership = doctor.user.clinicMemberships[0];
    if (!membership) throw new AppError('NOT_FOUND', 'Doctor membership not found', 404);
    if (membership.role === UserRole.CLINIC_OWNER) {
      throw new AppError('FORBIDDEN', 'Cannot remove the clinic owner', 403);
    }

    const upcoming = await this.prisma.appointment.count({
      where: {
        clinicId,
        doctorId: doctor.id,
        startsAt: { gte: new Date() },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
    });
    if (upcoming > 0 && !force) {
      throw new AppError('DOCTOR_HAS_UPCOMING', 'Doctor has upcoming appointments', 409, {
        upcoming,
      });
    }

    await this.deactivate(clinicId, actorUserId, membership.id);
    return { ok: true as const, upcoming };
  }

  async updateDoctorAccount(
    clinicId: string,
    actorUserId: string,
    doctorId: string,
    input: UpdateDoctorAccountInput,
  ) {
    const doctor = await this.requireClinicDoctor(clinicId, doctorId);
    const firstName = input.firstName?.trim();
    const lastName = input.lastName?.trim();

    await this.prisma.$transaction(async (tx) => {
      if (firstName || lastName) {
        await tx.user.update({
          where: { id: doctor.userId },
          data: {
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
          },
        });
      }
      await tx.doctorProfile.update({
        where: { id: doctor.id },
        data: {
          ...(input.specialty ? { specialty: input.specialty } : {}),
          ...(input.experienceYears !== undefined ? { experienceYears: input.experienceYears } : {}),
          ...(input.priceFrom !== undefined ? { priceFromUzs: input.priceFrom || null } : {}),
        },
      });
      if (input.schedule) {
        const links = await tx.doctorClinic.findMany({
          where: { doctorId: doctor.id, clinicId, isActive: true },
          select: { id: true },
        });
        await this.writeClinicSchedule(
          tx,
          doctor.id,
          links.map((l) => l.id),
          input.schedule,
          input.slotDuration,
        );
      }
    });

    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'doctor.updated',
      entity: 'DoctorProfile',
      entityId: doctor.id,
      before: {
        firstName: doctor.user.firstName,
        lastName: doctor.user.lastName,
        specialty: doctor.specialty,
        experienceYears: doctor.experienceYears,
        priceFromUzs: doctor.priceFromUzs,
      },
      after: { ...input },
    });
    return { ok: true as const };
  }

  /**
   * Resets the doctor's password to DEFAULT_DOCTOR_PASSWORD and signs them out everywhere.
   * Refused for accounts active in other clinics, since the password is global to the user.
   */
  async resetDoctorPassword(clinicId: string, actorUserId: string, doctorId: string) {
    const doctor = await this.requireClinicDoctor(clinicId, doctorId);
    const membership = doctor.user.clinicMemberships[0];
    if (!membership) throw new AppError('NOT_FOUND', 'Doctor membership not found', 404);
    if (membership.role !== UserRole.DOCTOR) {
      throw new AppError('PASSWORD_RESET_FORBIDDEN', 'Only doctor accounts can be reset', 403);
    }

    const otherClinics = await this.prisma.clinicMember.count({
      where: { userId: doctor.userId, isActive: true, clinicId: { not: clinicId } },
    });
    if (otherClinics > 0) {
      throw new AppError(
        'PASSWORD_RESET_FORBIDDEN',
        'Doctor account is shared with another clinic',
        403,
      );
    }

    const passwordHash = await argon2.hash(DEFAULT_DOCTOR_PASSWORD);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: doctor.userId }, data: { passwordHash } }),
      this.prisma.clinicMember.update({
        where: { id: membership.id },
        data: { mustChangePassword: true },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: doctor.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'doctor.password_reset',
      entity: 'DoctorProfile',
      entityId: doctor.id,
    });
    return {
      ok: true as const,
      login: doctor.user.phone ?? '',
      temporaryPassword: DEFAULT_DOCTOR_PASSWORD,
    };
  }

  private async writeClinicSchedule(
    tx: Prisma.TransactionClient,
    doctorId: string,
    linkIds: string[],
    schedule: ScheduleDay[],
    slotDuration = DEFAULT_SLOT_MINUTES,
  ) {
    if (!linkIds.length) return;
    await tx.doctorSchedule.deleteMany({ where: { doctorClinicId: { in: linkIds } } });
    if (!schedule.length) return;
    await tx.doctorSchedule.createMany({
      data: linkIds.flatMap((linkId) =>
        schedule.map((s) => ({
          doctorId,
          doctorClinicId: linkId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          breakStart: s.breakStart,
          breakEnd: s.breakEnd,
          slotDuration,
        })),
      ),
    });
  }

  private async requireClinicDoctor(clinicId: string, doctorId: string) {
    const doctor = await this.prisma.doctorProfile.findFirst({
      where: { id: doctorId, clinics: { some: { clinicId, isActive: true } } },
      include: {
        user: { include: { clinicMemberships: { where: { clinicId }, take: 1 } } },
      },
    });
    if (!doctor) throw new AppError('NOT_FOUND', 'Doctor not found', 404);
    return doctor;
  }

  private async attachExistingUser(
    clinicId: string,
    actorUserId: string,
    user: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      email: string | null;
      doctorProfile: { id: string } | null;
    },
    dto: CreateMemberDto,
    doctorProfile?: DoctorLinkOptions,
  ) {
    const now = new Date();
    const existingMember = await this.prisma.clinicMember.findUnique({
      where: { clinicId_userId: { clinicId, userId: user.id } },
    });

    const member = await this.prisma.$transaction(async (tx) => {
      let m = existingMember
        ? await tx.clinicMember.update({
            where: { id: existingMember.id },
            data: {
              role: dto.role,
              isActive: true,
              startedAt: existingMember.isActive ? existingMember.startedAt : now,
              endedAt: null,
              joinedAt: existingMember.joinedAt ?? now,
              invitedByUserId: actorUserId,
              mustChangePassword: false,
            },
            include: { user: true, permissions: true },
          })
        : await tx.clinicMember.create({
            data: {
              clinicId,
              userId: user.id,
              role: dto.role,
              isActive: true,
              joinedAt: now,
              startedAt: now,
              invitedByUserId: actorUserId,
            },
            include: { user: true, permissions: true },
          });

      await tx.userRoleAssignment.upsert({
        where: {
          userId_role_clinicId: {
            userId: user.id,
            role: dto.role,
            clinicId,
          },
        },
        create: { userId: user.id, role: dto.role, clinicId },
        update: {},
      });

      if (dto.permissions) {
        await tx.clinicMemberPermission.deleteMany({ where: { clinicMemberId: m.id } });
        await tx.clinicMemberPermission.createMany({
          data: dto.permissions.map((p) => ({
            clinicMemberId: m.id,
            permission: p.permission,
            effect: p.effect,
          })),
        });
        m = await tx.clinicMember.findUniqueOrThrow({
          where: { id: m.id },
          include: { user: true, permissions: true },
        });
      }

      if (dto.role === UserRole.DOCTOR) {
        await this.ensureDoctorLink(tx, {
          userId: user.id,
          clinicId,
          specialty: dto.specialty ?? 'Stomatolog',
          experienceYears: doctorProfile?.experienceYears,
          schedule: doctorProfile?.schedule,
          slotDuration: doctorProfile?.slotDuration,
          existingDoctorId: user.doctorProfile?.id,
          serviceIds: dto.serviceIds,
        });
        if (doctorProfile && user.doctorProfile && dto.specialty) {
          await tx.doctorProfile.update({
            where: { id: user.doctorProfile.id },
            data: {
              specialty: dto.specialty,
              ...(doctorProfile.experienceYears !== undefined
                ? { experienceYears: doctorProfile.experienceYears }
                : {}),
            },
          });
        }
      }

      return m;
    });

    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: existingMember ? 'member.reactivated_or_updated' : 'member.attached',
      entity: 'ClinicMember',
      entityId: member.id,
      after: { role: dto.role, userId: user.id },
    });

    return {
      kind: 'attached' as const,
      existingUser: true,
      displayName: maskName(user.firstName, user.lastName),
      member: this.toMemberDto(member),
    };
  }

  private async createInvitation(
    clinicId: string,
    actorUserId: string,
    dto: CreateMemberDto & {
      phone: string;
      email: string;
      existingUserId?: string;
    },
  ) {
    // Invalidate prior pending invites for same email/phone in this clinic
    await this.prisma.clinicInvitation.updateMany({
      where: {
        clinicId,
        status: InvitationStatus.PENDING,
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
      data: { status: InvitationStatus.REVOKED },
    });

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const clinic = await this.prisma.clinic.findUniqueOrThrow({
      where: { id: clinicId },
      select: { name: true },
    });

    const invitation = await this.prisma.clinicInvitation.create({
      data: {
        clinicId,
        invitedById: actorUserId,
        email: dto.email,
        phone: dto.phone,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: dto.role,
        specialty: dto.specialty,
        tokenHash,
        expiresAt,
        permissions: dto.permissions
          ? (dto.permissions as unknown as object)
          : undefined,
      },
    });

    const base =
      this.config.get<string>('app.appWebUrl') ?? 'http://localhost:3000';
    const acceptUrl = `${base.replace(/\/$/, '')}/invite/${token}`;

    try {
      await this.mail.sendClinicInvitation({
        to: dto.email,
        clinicName: clinic.name,
        inviteeName: `${dto.firstName} ${dto.lastName}`.trim(),
        role: dto.role,
        acceptUrl,
        expiresAt,
      });
    } catch {
      await this.prisma.clinicInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.REVOKED },
      });
      throw new AppError('MAIL_SEND_FAILED', 'Invitation email could not be sent', 502);
    }

    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'member.invited',
      entity: 'ClinicInvitation',
      entityId: invitation.id,
      after: {
        role: dto.role,
        email: dto.email,
        existingUser: Boolean(dto.existingUserId),
      },
    });

    const isProd = this.config.get<string>('app.nodeEnv') === 'production';
    return {
      kind: 'invitation' as const,
      existingUser: Boolean(dto.existingUserId),
      invitationId: invitation.id,
      status: InvitationStatus.PENDING,
      expiresAt: invitation.expiresAt.toISOString(),
      ...(isProd ? {} : { activationToken: token }),
    };
  }

  async listInvitations(clinicId: string) {
    const rows = await this.prisma.clinicInvitation.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      phone: r.phone,
      firstName: r.firstName,
      lastName: r.lastName,
      fullName: `${r.firstName} ${r.lastName}`.trim(),
      role: r.role,
      status: r.status,
      expiresAt: r.expiresAt.toISOString(),
      acceptedAt: r.acceptedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async resendInvitation(clinicId: string, actorUserId: string, invitationId: string) {
    const prev = await this.prisma.clinicInvitation.findFirst({
      where: { id: invitationId, clinicId },
    });
    if (!prev) throw new AppError('NOT_FOUND', 'Invitation not found', 404);
    if (!prev.email) {
      throw new AppError('VALIDATION_ERROR', 'Invitation has no email', 400);
    }
    if (
      prev.status === InvitationStatus.ACCEPTED ||
      prev.status === InvitationStatus.REVOKED
    ) {
      throw new AppError(
        'INVITATION_ALREADY_ACCEPTED',
        'Invitation cannot be resent',
        400,
      );
    }

    return this.createInvitation(clinicId, actorUserId, {
      firstName: prev.firstName,
      lastName: prev.lastName,
      phone: prev.phone ?? '',
      email: prev.email,
      role: prev.role,
      specialty: prev.specialty ?? undefined,
      permissions:
        (prev.permissions as unknown as CreateMemberDto['permissions']) ??
        undefined,
    });
  }

  private async createNewUserWithTempPassword(
    clinicId: string,
    actorUserId: string,
    dto: CreateMemberDto & { phone: string; email?: string },
    options: { password?: string } & DoctorLinkOptions = {},
  ) {
    const tempPassword = options.password ?? `Tmp${randomBytes(4).toString('hex')}9a`;
    const passwordHash = await argon2.hash(tempPassword);
    const now = new Date();

    const member = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: dto.phone,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phoneVerifiedAt: now,
        },
      });

      const m = await tx.clinicMember.create({
        data: {
          clinicId,
          userId: user.id,
          role: dto.role,
          isActive: true,
          joinedAt: now,
          startedAt: now,
          invitedByUserId: actorUserId,
          mustChangePassword: true,
        },
        include: { user: true, permissions: true },
      });

      await tx.userRoleAssignment.create({
        data: { userId: user.id, role: dto.role, clinicId },
      });

      if (dto.permissions?.length) {
        await tx.clinicMemberPermission.createMany({
          data: dto.permissions.map((p) => ({
            clinicMemberId: m.id,
            permission: p.permission,
            effect: p.effect,
          })),
        });
      }

      if (dto.role === UserRole.DOCTOR) {
        await this.ensureDoctorLink(tx, {
          userId: user.id,
          clinicId,
          specialty: dto.specialty ?? 'Stomatolog',
          experienceYears: options.experienceYears,
          schedule: options.schedule,
          slotDuration: options.slotDuration,
          serviceIds: dto.serviceIds,
        });
      }

      return tx.clinicMember.findUniqueOrThrow({
        where: { id: m.id },
        include: { user: true, permissions: true },
      });
    });

    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'member.created_temp_password',
      entity: 'ClinicMember',
      entityId: member.id,
      after: { role: dto.role },
    });

    return {
      kind: 'created' as const,
      existingUser: false,
      mustChangePassword: true,
      temporaryPassword: tempPassword,
      member: this.toMemberDto(member),
    };
  }

  async update(
    clinicId: string,
    actorUserId: string,
    membershipId: string,
    dto: UpdateMemberDto,
  ) {
    const member = await this.requireMember(clinicId, membershipId);
    if (member.role === UserRole.CLINIC_OWNER) {
      throw new AppError('FORBIDDEN', 'Cannot change clinic owner membership this way', 403);
    }
    if (dto.role && dto.role !== member.role) {
      this.assertAssignableRole(dto.role);
      this.assertManageable(member, actorUserId);
      await this.assertGrantable(clinicId, actorUserId, [], dto.role);
    }

    const firstName = dto.firstName?.trim();
    const lastName = dto.lastName?.trim();

    const updated = await this.prisma.$transaction(async (tx) => {
      if (firstName || lastName) {
        await tx.user.update({
          where: { id: member.userId },
          data: {
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
          },
        });
      }
      const m = await tx.clinicMember.update({
        where: { id: membershipId },
        data: { role: dto.role ?? member.role },
        include: { user: true, permissions: true },
      });
      if (dto.role && dto.role !== member.role) {
        await tx.userRoleAssignment.deleteMany({
          where: { userId: member.userId, clinicId, role: member.role },
        });
        await tx.userRoleAssignment.upsert({
          where: {
            userId_role_clinicId: {
              userId: member.userId,
              role: dto.role,
              clinicId,
            },
          },
          create: { userId: member.userId, role: dto.role, clinicId },
          update: {},
        });
        if (dto.role === UserRole.DOCTOR) {
          await this.ensureDoctorLink(tx, {
            userId: member.userId,
            clinicId,
            specialty: dto.specialty ?? 'Stomatolog',
          });
        } else if (member.role === UserRole.DOCTOR) {
          const doctor = await tx.doctorProfile.findUnique({ where: { userId: member.userId } });
          if (doctor) {
            await tx.doctorClinic.updateMany({
              where: { doctorId: doctor.id, clinicId, isActive: true },
              data: { isActive: false, endedAt: new Date() },
            });
          }
        }
      }
      return m;
    });

    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'member.updated',
      entity: 'ClinicMember',
      entityId: membershipId,
      before: {
        role: member.role,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
      },
      after: {
        role: updated.role,
        firstName: updated.user.firstName,
        lastName: updated.user.lastName,
      },
    });

    return this.toMemberDto(updated);
  }

  async updatePermissions(
    clinicId: string,
    actorUserId: string,
    membershipId: string,
    dto: UpdateMemberPermissionsDto,
  ) {
    const member = await this.requireMember(clinicId, membershipId);
    this.assertManageable(member, actorUserId);
    await this.assertGrantable(clinicId, actorUserId, dto.permissions);
    const before = member.permissions.map((p) => ({ permission: p.permission, effect: p.effect }));
    await this.prisma.$transaction(async (tx) => {
      await tx.clinicMemberPermission.deleteMany({ where: { clinicMemberId: membershipId } });
      if (dto.permissions.length) {
        await tx.clinicMemberPermission.createMany({
          data: dto.permissions.map((p) => ({
            clinicMemberId: membershipId,
            permission: p.permission,
            effect: p.effect,
          })),
        });
      }
    });
    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'member.permissions_changed',
      entity: 'ClinicMember',
      entityId: membershipId,
      before: { permissions: before },
      after: { permissions: dto.permissions },
    });
    return this.getOne(clinicId, membershipId);
  }

  async deactivate(clinicId: string, actorUserId: string, membershipId: string) {
    const member = await this.requireMember(clinicId, membershipId);
    this.assertManageable(member, actorUserId);
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.clinicMember.update({
        where: { id: membershipId },
        data: { isActive: false, endedAt: now },
      });
      if (member.role === UserRole.DOCTOR) {
        const doctor = await tx.doctorProfile.findUnique({ where: { userId: member.userId } });
        if (doctor) {
          await tx.doctorClinic.updateMany({
            where: { doctorId: doctor.id, clinicId, isActive: true },
            data: { isActive: false, endedAt: now },
          });
        }
      }
    });
    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'member.deactivated',
      entity: 'ClinicMember',
      entityId: membershipId,
    });
    return this.getOne(clinicId, membershipId);
  }

  async reactivate(clinicId: string, actorUserId: string, membershipId: string) {
    const member = await this.requireMember(clinicId, membershipId);
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.clinicMember.update({
        where: { id: membershipId },
        data: { isActive: true, endedAt: null, startedAt: now, joinedAt: member.joinedAt ?? now },
      });
      if (member.role === UserRole.DOCTOR) {
        await this.ensureDoctorLink(tx, {
          userId: member.userId,
          clinicId,
          specialty: 'Stomatolog',
        });
      }
    });
    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'member.reactivated',
      entity: 'ClinicMember',
      entityId: membershipId,
    });
    return this.getOne(clinicId, membershipId);
  }

  async peekInvitation(token: string) {
    const invitation = await this.findInvitationByToken(token);
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: invitation.clinicId },
      select: { name: true },
    });
    const existingUser = await this.findInvitedUser(invitation);
    return {
      clinicId: invitation.clinicId,
      clinicName: clinic?.name ?? '',
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      role: invitation.role,
      email: invitation.email,
      phone: invitation.phone,
      existingUser: Boolean(existingUser),
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  private findInvitedUser(invitation: { email: string | null; phone: string | null }) {
    const phone = invitation.phone ? normalizePhone(invitation.phone) : null;
    if (!invitation.email && !phone) return Promise.resolve(null);
    return this.prisma.user.findFirst({
      where: {
        OR: [
          ...(invitation.email ? [{ email: invitation.email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });
  }

  /**
   * New people choose their password here. Existing accounts keep theirs and must
   * confirm it, so a leaked link cannot attach someone else's account.
   */
  async acceptInvitation(token: string, dto: AcceptInvitationDto) {
    const invitation = await this.findInvitationByToken(token);
    const existingUser = await this.findInvitedUser(invitation);
    if (existingUser) {
      const ok = existingUser.passwordHash
        ? await argon2.verify(existingUser.passwordHash, dto.password).catch(() => false)
        : false;
      if (!ok) throw new AppError('INVALID_CREDENTIALS', 'Wrong password', 401);
      const membership = await this.prisma.clinicMember.findUnique({
        where: { clinicId_userId: { clinicId: invitation.clinicId, userId: existingUser.id } },
      });
      if (membership?.isActive) {
        throw new AppError('ALREADY_MEMBER', 'User is already a clinic member', 409);
      }
    } else if (!isValidPassword(dto.password)) {
      throw new AppError('INVALID_PASSWORD', 'Weak password', 400);
    }
    const now = new Date();
    const phone = invitation.phone ? normalizePhone(invitation.phone) : null;

    const member = await this.prisma.$transaction(async (tx) => {
      let user = existingUser;

      if (!user) {
        user = await tx.user.create({
          data: {
            email: invitation.email,
            phone,
            passwordHash: await argon2.hash(dto.password),
            firstName: invitation.firstName,
            lastName: invitation.lastName,
            emailVerifiedAt: invitation.email ? now : null,
            phoneVerifiedAt: phone ? now : null,
          },
        });
      } else if (invitation.email && user.email === invitation.email && !user.emailVerifiedAt) {
        user = await tx.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: now },
        });
      }

      const m = await tx.clinicMember.upsert({
        where: { clinicId_userId: { clinicId: invitation.clinicId, userId: user.id } },
        create: {
          clinicId: invitation.clinicId,
          userId: user.id,
          role: invitation.role,
          isActive: true,
          joinedAt: now,
          startedAt: now,
          invitedByUserId: invitation.invitedById,
          mustChangePassword: false,
        },
        update: {
          role: invitation.role,
          isActive: true,
          startedAt: now,
          endedAt: null,
          joinedAt: now,
          mustChangePassword: false,
        },
        include: { user: true, permissions: true },
      });

      await tx.userRoleAssignment.upsert({
        where: {
          userId_role_clinicId: {
            userId: user.id,
            role: invitation.role,
            clinicId: invitation.clinicId,
          },
        },
        create: {
          userId: user.id,
          role: invitation.role,
          clinicId: invitation.clinicId,
        },
        update: {},
      });

      const overrides = invitation.permissions as { permission: string; effect: PermissionEffect }[] | null;
      if (overrides) {
        await tx.clinicMemberPermission.deleteMany({ where: { clinicMemberId: m.id } });
        await tx.clinicMemberPermission.createMany({
          data: overrides.map((p) => ({
            clinicMemberId: m.id,
            permission: p.permission,
            effect: p.effect,
          })),
        });
      }

      if (invitation.role === UserRole.DOCTOR) {
        await this.ensureDoctorLink(tx, {
          userId: user.id,
          clinicId: invitation.clinicId,
          specialty: invitation.specialty ?? 'Stomatolog',
        });
      }

      await tx.clinicInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED, acceptedAt: now },
      });

      return tx.clinicMember.findUniqueOrThrow({
        where: { id: m.id },
        include: { user: true, permissions: true },
      });
    });

    await this.audit.log({
      clinicId: invitation.clinicId,
      action: 'member.invitation_accepted',
      entity: 'ClinicMember',
      entityId: member.id,
    });

    return { ok: true, member: this.toMemberDto(member) };
  }

  private async ensureDoctorLink(
    tx: Prisma.TransactionClient,
    input: {
      userId: string;
      clinicId: string;
      specialty: string;
      experienceYears?: number;
      existingDoctorId?: string;
      serviceIds?: string[];
      /** Replaces this clinic's schedule; otherwise a default is created only if none exists. */
      schedule?: ScheduleDay[];
      slotDuration?: number;
    },
  ) {
    let doctorId = input.existingDoctorId;
    if (!doctorId) {
      const existing = await tx.doctorProfile.findUnique({ where: { userId: input.userId } });
      if (existing) doctorId = existing.id;
      else {
        const created = await tx.doctorProfile.create({
          data: {
            userId: input.userId,
            specialty: input.specialty,
            experienceYears: input.experienceYears ?? 0,
          },
        });
        doctorId = created.id;
      }
    }

    const branch = await tx.clinicBranch.findFirst({
      where: { clinicId: input.clinicId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    let link = await tx.doctorClinic.findFirst({
      where: {
        doctorId,
        clinicId: input.clinicId,
        ...(branch ? { branchId: branch.id } : { branchId: null }),
      },
    });

    if (!link) {
      link = await tx.doctorClinic.findFirst({
        where: { doctorId, clinicId: input.clinicId },
      });
    }

    if (!link) {
      link = await tx.doctorClinic.create({
        data: {
          doctorId,
          clinicId: input.clinicId,
          branchId: branch?.id,
          isActive: true,
          startedAt: new Date(),
          endedAt: null,
        },
      });
    } else {
      link = await tx.doctorClinic.update({
        where: { id: link.id },
        data: {
          isActive: true,
          endedAt: null,
          branchId: link.branchId ?? branch?.id,
          startedAt: link.isActive ? link.startedAt : new Date(),
        },
      });
    }

    if (input.schedule) {
      await this.writeClinicSchedule(tx, doctorId, [link.id], input.schedule, input.slotDuration);
    } else if ((await tx.doctorSchedule.count({ where: { doctorClinicId: link.id } })) === 0) {
      await tx.doctorSchedule.createMany({
        data: DEFAULT_SCHEDULE.map((s) => ({
          doctorId,
          doctorClinicId: link!.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          breakStart: s.breakStart,
          breakEnd: s.breakEnd,
          slotDuration: s.slotDuration,
        })),
      });
    }

    const serviceIds =
      input.serviceIds?.length
        ? input.serviceIds
        : (
            await tx.clinicService.findMany({
              where: { clinicId: input.clinicId, isActive: true },
              select: { serviceId: true },
            })
          ).map((s) => s.serviceId);
    for (const serviceId of serviceIds) {
      await tx.doctorService.upsert({
        where: { doctorId_serviceId: { doctorId, serviceId } },
        create: { doctorId, serviceId, isActive: true },
        update: { isActive: true },
      });
    }

    await tx.userRoleAssignment.upsert({
      where: {
        userId_role_clinicId: {
          userId: input.userId,
          role: UserRole.DOCTOR,
          clinicId: input.clinicId,
        },
      },
      create: {
        userId: input.userId,
        role: UserRole.DOCTOR,
        clinicId: input.clinicId,
      },
      update: {},
    });
  }

  private async requireMember(clinicId: string, membershipId: string) {
    const m = await this.prisma.clinicMember.findFirst({
      where: { id: membershipId, clinicId },
      include: { user: true, permissions: true },
    });
    if (!m) throw new AppError('NOT_FOUND', 'Member not found', 404);
    return m;
  }

  private async findInvitationByToken(token: string) {
    if (!token?.trim()) {
      throw new AppError('INVITATION_INVALID', 'Invitation invalid', 400);
    }
    const tokenHash = this.hashToken(token);
    const invitation = await this.prisma.clinicInvitation.findUnique({
      where: { tokenHash },
    });
    if (!invitation) {
      throw new AppError('INVITATION_INVALID', 'Invitation invalid', 400);
    }
    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new AppError(
        'INVITATION_ALREADY_ACCEPTED',
        'Invitation already accepted',
        400,
      );
    }
    if (
      invitation.status === InvitationStatus.REVOKED ||
      invitation.status === InvitationStatus.EXPIRED
    ) {
      throw new AppError('INVITATION_INVALID', 'Invitation invalid', 400);
    }
    if (invitation.expiresAt < new Date()) {
      await this.prisma.clinicInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new AppError('INVITATION_EXPIRED', 'Invitation expired', 400);
    }
    return invitation;
  }

  private assertAssignableRole(role: UserRole) {
    if (!ASSIGNABLE_STAFF_ROLES.includes(role)) {
      throw new AppError('FORBIDDEN', 'Role cannot be assigned', 403);
    }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private toMemberDto(
    m: {
      id: string;
      clinicId: string;
      userId: string;
      role: UserRole;
      isActive: boolean;
      startedAt: Date;
      endedAt: Date | null;
      joinedAt: Date | null;
      mustChangePassword: boolean;
      user: { firstName: string; lastName: string; email: string | null; phone: string | null };
      permissions: { permission: string; effect: PermissionEffect }[];
    },
  ) {
    const rolePerms = expandEffectivePermissions([m.role], m.permissions);
    return {
      id: m.id,
      clinicId: m.clinicId,
      userId: m.userId,
      role: m.role,
      isActive: m.isActive,
      startedAt: m.startedAt.toISOString(),
      endedAt: m.endedAt?.toISOString() ?? null,
      joinedAt: m.joinedAt?.toISOString() ?? null,
      mustChangePassword: m.mustChangePassword,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      fullName: `${m.user.firstName} ${m.user.lastName}`.trim(),
      email: m.user.email,
      phone: m.user.phone,
      permissionOverrides: m.permissions.map((p) => ({
        permission: p.permission,
        effect: p.effect,
      })),
      effectivePermissions: [...rolePerms],
    };
  }
}
