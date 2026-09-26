import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InvitationStatus,
  PermissionEffect,
  UserRole,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { AuditService } from '../common/audit/audit.service';
import { AppError } from '../common/filters/global-exception.filter';
import {
  ASSIGNABLE_STAFF_ROLES,
  expandEffectivePermissions,
} from '../common/permissions/permissions';
import { isValidPassword } from '../common/utils/password.util';
import {
  isValidEmail,
  normalizeEmail,
  normalizePhone,
} from '../common/utils/phone.util';
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

      if (dto.permissions?.length) {
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
          existingDoctorId: user.doctorProfile?.id,
          serviceIds: dto.serviceIds,
        });
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

    await this.mail.sendClinicInvitation({
      to: dto.email,
      clinicName: clinic.name,
      inviteeName: `${dto.firstName} ${dto.lastName}`.trim(),
      role: dto.role,
      acceptUrl,
      expiresAt,
    });

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
  ) {
    const tempPassword = `Tmp${randomBytes(4).toString('hex')}9a`;
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
    if (dto.role) this.assertAssignableRole(dto.role);
    if (member.role === UserRole.CLINIC_OWNER) {
      throw new AppError('FORBIDDEN', 'Cannot change clinic owner membership this way', 403);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
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
        }
      }
      return m;
    });

    await this.audit.log({
      userId: actorUserId,
      clinicId,
      action: 'member.role_changed',
      entity: 'ClinicMember',
      entityId: membershipId,
      before: { role: member.role },
      after: { role: updated.role },
    });

    return this.toMemberDto(updated);
  }

  async updatePermissions(
    clinicId: string,
    actorUserId: string,
    membershipId: string,
    dto: UpdateMemberPermissionsDto,
  ) {
    await this.requireMember(clinicId, membershipId);
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
      after: { permissions: dto.permissions },
    });
    return this.getOne(clinicId, membershipId);
  }

  async deactivate(clinicId: string, actorUserId: string, membershipId: string) {
    const member = await this.requireMember(clinicId, membershipId);
    if (member.role === UserRole.CLINIC_OWNER) {
      throw new AppError('FORBIDDEN', 'Cannot deactivate clinic owner', 403);
    }
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
    return {
      clinicId: invitation.clinicId,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      role: invitation.role,
      email: invitation.email,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  async acceptInvitation(token: string, dto: AcceptInvitationDto) {
    if (!isValidPassword(dto.password)) {
      throw new AppError('INVALID_PASSWORD', 'Weak password', 400);
    }
    const invitation = await this.findInvitationByToken(token);
    const passwordHash = await argon2.hash(dto.password);
    const now = new Date();
    const phone = invitation.phone ? normalizePhone(invitation.phone) : null;

    const member = await this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findFirst({
        where: {
          OR: [
            ...(invitation.email ? [{ email: invitation.email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: invitation.email,
            phone,
            passwordHash,
            firstName: invitation.firstName,
            lastName: invitation.lastName,
            emailVerifiedAt: invitation.email ? now : null,
            phoneVerifiedAt: phone ? now : null,
          },
        });
      } else {
        // Existing user accepting invite — do not overwrite password
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
          endedAt: null,
          joinedAt: now,
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

      const overrides = (invitation.permissions as { permission: string; effect: PermissionEffect }[] | null) ?? [];
      if (overrides.length) {
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
      existingDoctorId?: string;
      serviceIds?: string[];
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

    const scheduleCount = await tx.doctorSchedule.count({
      where: { doctorClinicId: link.id },
    });
    if (scheduleCount === 0) {
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
