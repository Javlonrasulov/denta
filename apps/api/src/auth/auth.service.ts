import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ClinicAccountStatus,
  OtpPurpose,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomInt, randomUUID } from 'crypto';
import { addDays, addMinutes, differenceInCalendarDays } from 'date-fns';
import { AppError } from '../common/filters/global-exception.filter';
import { AuthUser, JwtPayload } from '../common/guards/auth.guards';
import { isValidPassword, slugify } from '../common/utils/password.util';
import {
  isValidEmail,
  normalizeEmail,
  normalizePhone,
} from '../common/utils/phone.util';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginDto,
  OnboardingDto,
  RegisterClinicDto,
  ResetPasswordDto,
  VerifyEmailDto,
  RegisterPatientDto,
} from './dto/auth.dto';

export type SessionMeta = {
  userAgent?: string;
  ip?: string;
  deviceName?: string;
  platform?: string;
};

type ClinicAuthUserDto = {
  id: string;
  role: 'clinic';
  clinicName: string;
  adminFirstName: string;
  adminLastName: string;
  email: string;
  phone: string;
  emailVerifiedAt: string | null;
  accountStatus: 'pending_verification' | 'active' | 'blocked';
  subscription: {
    status: 'trial' | 'active' | 'expired' | 'blocked';
    trialStartedAt: string | null;
    trialEndsAt: string | null;
    subscriptionStartedAt: string | null;
    subscriptionEndsAt: string | null;
    marketplaceBookingEnabled: boolean;
  };
  onboardingCompleted: boolean;
  onboardingStep: number;
  createdAt: string;
};

type DoctorAuthUserDto = {
  id: string;
  role: 'doctor';
  doctorId: string;
  clinicId: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  specialty: string;
  emailVerifiedAt: string | null;
  createdAt: string;
};

type PatientAuthUserDto = {
  id: string;
  role: 'patient';
  patientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
};

type AuthUserDto = ClinicAuthUserDto | DoctorAuthUserDto | PatientAuthUserDto;

type AuthSessionDto = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUserDto;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async registerClinic(dto: RegisterClinicDto) {
    if (!dto.acceptTerms) {
      throw new AppError('TERMS_REQUIRED', 'Terms must be accepted', 400);
    }
    if (!isValidPassword(dto.password)) {
      throw new AppError(
        'INVALID_PASSWORD',
        'Password must be at least 8 characters with a letter and a digit',
        400,
      );
    }
    const email = normalizeEmail(dto.email);
    if (!isValidEmail(email)) {
      throw new AppError('INVALID_EMAIL', 'Invalid email', 400);
    }
    const phone = normalizePhone(dto.phone);
    if (!phone) {
      throw new AppError('INVALID_PHONE', 'Invalid Uzbek phone number', 400);
    }

    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new AppError('EMAIL_TAKEN', 'Email already registered', 409);
    }
    const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      throw new AppError('PHONE_TAKEN', 'Phone already registered', 409);
    }

    const passwordHash = await argon2.hash(dto.password);
    const baseSlug = slugify(dto.clinicName) || 'clinic';
    const slug = await this.uniqueClinicSlug(baseSlug);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          firstName: dto.adminFirstName.trim(),
          lastName: dto.adminLastName.trim(),
          locale: dto.locale ?? 'uz',
        },
      });

      const clinic = await tx.clinic.create({
        data: {
          name: dto.clinicName.trim(),
          slug,
          phone,
          email,
          accountStatus: ClinicAccountStatus.PENDING_VERIFICATION,
        },
      });

      await tx.clinicMember.create({
        data: {
          clinicId: clinic.id,
          userId: createdUser.id,
          role: UserRole.CLINIC_OWNER,
          joinedAt: new Date(),
        },
      });

      await tx.userRoleAssignment.create({
        data: {
          userId: createdUser.id,
          role: UserRole.CLINIC_OWNER,
          clinicId: clinic.id,
        },
      });

      return createdUser;
    });

    const cooldown = await this.issueOtp(
      email,
      OtpPurpose.EMAIL_VERIFICATION,
      user.id,
    );
    return { email, resendAvailableIn: cooldown };
  }

  async registerPatient(dto: RegisterPatientDto) {
    if (!isValidPassword(dto.password)) {
      throw new AppError(
        'INVALID_PASSWORD',
        'Password must be at least 8 characters with a letter and a digit',
        400,
      );
    }
    const phone = normalizePhone(dto.phone);
    if (!phone) {
      throw new AppError('INVALID_PHONE', 'Invalid Uzbek phone number', 400);
    }
    const email = dto.email ? normalizeEmail(dto.email) : null;
    if (email && !isValidEmail(email)) {
      throw new AppError('INVALID_EMAIL', 'Invalid email', 400);
    }

    const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      throw new AppError('PHONE_TAKEN', 'Phone already registered', 409);
    }
    if (email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        throw new AppError('EMAIL_TAKEN', 'Email already registered', 409);
      }
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          phone,
          email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phoneVerifiedAt: new Date(),
          emailVerifiedAt: email ? null : new Date(),
        },
      });

      await tx.patientProfile.create({
        data: { userId: createdUser.id },
      });

      await tx.userRoleAssignment.create({
        data: {
          userId: createdUser.id,
          role: UserRole.PATIENT,
        },
      });

      return createdUser;
    });

    return this.createSession(user.id);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<AuthSessionDto> {
    const email = normalizeEmail(dto.email);
    await this.consumeOtp(email, OtpPurpose.EMAIL_VERIFICATION, dto.code);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        clinicMemberships: { where: { isActive: true }, take: 1 },
      },
    });
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    const membership = user.clinicMemberships[0];
    if (!membership) {
      throw new AppError('NOT_FOUND', 'Clinic membership not found', 404);
    }

    const trialDays = this.config.get<number>('app.trialDays') ?? 30;
    const now = new Date();
    const trialEndsAt = addDays(now, trialDays);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: now },
      });
      await tx.clinic.update({
        where: { id: membership.clinicId },
        data: { accountStatus: ClinicAccountStatus.ACTIVE },
      });
      await tx.subscription.upsert({
        where: { clinicId: membership.clinicId },
        create: {
          clinicId: membership.clinicId,
          status: SubscriptionStatus.TRIAL,
          trialStartedAt: now,
          trialEndsAt,
          marketplaceBookingEnabled: true,
        },
        update: {
          status: SubscriptionStatus.TRIAL,
          trialStartedAt: now,
          trialEndsAt,
          marketplaceBookingEnabled: true,
        },
      });
      await tx.subscriptionHistory.create({
        data: {
          clinicId: membership.clinicId,
          toStatus: SubscriptionStatus.TRIAL,
          note: 'Email verified — trial started',
        },
      });
    });

    return this.createSession(user.id);
  }

  async resendVerification(emailRaw: string) {
    const email = normalizeEmail(emailRaw);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Do not leak existence
      return {
        resendAvailableIn:
          this.config.get<number>('app.otp.resendCooldownSeconds') ?? 60,
      };
    }
    if (user.emailVerifiedAt) {
      throw new AppError('EMAIL_TAKEN', 'Email already verified', 400);
    }
    const cooldown = await this.issueOtp(
      email,
      OtpPurpose.EMAIL_VERIFICATION,
      user.id,
    );
    return { resendAvailableIn: cooldown };
  }

  async login(dto: LoginDto, meta: SessionMeta = {}) {
    const identifier = dto.identifier.trim();
    const email = identifier.includes('@')
      ? normalizeEmail(identifier)
      : null;
    const phone = email ? null : normalizePhone(identifier);

    const user = await this.prisma.user.findFirst({
      where: email ? { email } : phone ? { phone } : { id: 'impossible' },
      include: {
        clinicMemberships: { where: { isActive: true }, take: 1 },
        roles: true,
      },
    });

    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid credentials', 401);
    }

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid credentials', 401);
    }

    const isPatient = user.roles.some((r) => r.role === UserRole.PATIENT);
    const isDoctor = user.roles.some((r) => r.role === UserRole.DOCTOR);
    const verified =
      Boolean(user.emailVerifiedAt) ||
      Boolean(user.phoneVerifiedAt) ||
      isPatient ||
      isDoctor;

    if (!verified) {
      return {
        session: null,
        requiresEmailVerification: true,
        email: user.email ?? undefined,
      };
    }

    const session = await this.createSession(user.id, meta);
    return {
      session,
      requiresEmailVerification: false,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const hash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash: hash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async refresh(refreshToken: string, meta: SessionMeta = {}): Promise<AuthSessionDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('app.jwt.refreshSecret'),
      });
    } catch {
      throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);
    }
    if (payload.type !== 'refresh') {
      throw new AppError('UNAUTHORIZED', 'Invalid token type', 401);
    }

    const hash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppError('UNAUTHORIZED', 'Refresh token revoked or expired', 401);
    }

    // Rotate
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.createSession(payload.sub, {
      userAgent: meta.userAgent ?? stored.userAgent ?? undefined,
      ip: meta.ip ?? stored.ip ?? undefined,
      deviceName: meta.deviceName ?? stored.deviceName ?? undefined,
      platform: meta.platform ?? stored.platform ?? undefined,
    });
  }

  async listSessions(userId: string, currentRefreshToken?: string) {
    const currentHash = currentRefreshToken
      ? this.hashToken(currentRefreshToken)
      : null;
    const rows = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      deviceName: r.deviceName || this.deviceFromUa(r.userAgent),
      platform: r.platform || this.platformFromUa(r.userAgent),
      ipAddress: r.ip ?? null,
      userAgent: r.userAgent ?? null,
      createdAt: r.createdAt.toISOString(),
      lastUsedAt: r.lastUsedAt.toISOString(),
      current: currentHash ? r.tokenHash === currentHash : false,
      revokedAt: null as string | null,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const row = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    });
    if (!row) throw new AppError('NOT_FOUND', 'Session not found', 404);
    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async revokeAllOtherSessions(userId: string, currentRefreshToken?: string) {
    const currentHash = currentRefreshToken
      ? this.hashToken(currentRefreshToken)
      : null;
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(currentHash ? { NOT: { tokenHash: currentHash } } : {}),
      },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  private deviceFromUa(ua?: string | null): string {
    if (!ua) return 'Unknown device';
    if (/android/i.test(ua)) return 'Android';
    if (/iphone|ipad|ios/i.test(ua)) return 'iOS';
    if (/windows/i.test(ua)) return 'Windows';
    if (/mac os|macintosh/i.test(ua)) return 'macOS';
    if (/linux/i.test(ua)) return 'Linux';
    return 'Web browser';
  }

  private platformFromUa(ua?: string | null): string {
    if (!ua) return 'unknown';
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ios/i.test(ua)) return 'ios';
    return 'web';
  }

  async forgotPassword(emailRaw: string) {
    const email = normalizeEmail(emailRaw);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const cooldown =
      this.config.get<number>('app.otp.resendCooldownSeconds') ?? 60;
    if (!user) return { resendAvailableIn: cooldown };
    const resendAvailableIn = await this.issueOtp(
      email,
      OtpPurpose.PASSWORD_RESET,
      user.id,
    );
    return { resendAvailableIn };
  }

  async verifyResetCode(emailRaw: string, code: string) {
    const email = normalizeEmail(emailRaw);
    await this.verifyOtpOnly(email, OtpPurpose.PASSWORD_RESET, code);
    const resetToken = await this.jwt.signAsync(
      { sub: email, type: 'reset' },
      {
        secret: this.config.get<string>('app.jwt.accessSecret'),
        expiresIn: '15m' as const,
      },
    );
    return { resetToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (!isValidPassword(dto.newPassword)) {
      throw new AppError('INVALID_PASSWORD', 'Invalid password', 400);
    }
    const email = normalizeEmail(dto.email);
    await this.consumeOtp(email, OtpPurpose.PASSWORD_RESET, dto.code);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async getCurrentUser(userId: string): Promise<AuthUserDto> {
    return this.buildAuthUser(userId);
  }

  async getSubscriptionStatus(userId: string) {
    const user = await this.buildAuthUser(userId);
    if (user.role !== 'clinic') {
      throw new AppError('NOT_FOUND', 'Clinic subscription not available', 404);
    }
    const sub = user.subscription;
    let daysRemaining: number | null = null;
    if (sub.status === 'trial' && sub.trialEndsAt) {
      daysRemaining = Math.max(
        0,
        differenceInCalendarDays(new Date(sub.trialEndsAt), new Date()),
      );
    } else if (sub.status === 'active' && sub.subscriptionEndsAt) {
      daysRemaining = Math.max(
        0,
        differenceInCalendarDays(
          new Date(sub.subscriptionEndsAt),
          new Date(),
        ),
      );
    }
    return {
      status: sub.status,
      trialStartedAt: sub.trialStartedAt,
      trialEndsAt: sub.trialEndsAt,
      daysRemaining,
      marketplaceBookingEnabled: sub.marketplaceBookingEnabled,
    };
  }

  async updateOnboarding(
    userId: string,
    dto: OnboardingDto,
  ): Promise<ClinicAuthUserDto> {
    const membership = await this.prisma.clinicMember.findFirst({
      where: { userId, isActive: true },
    });
    if (!membership) throw new AppError('NOT_FOUND', 'Clinic not found', 404);

    await this.prisma.clinic.update({
      where: { id: membership.clinicId },
      data: {
        onboardingStep: dto.step,
        ...(dto.completed !== undefined
          ? { onboardingCompleted: dto.completed }
          : {}),
      },
    });
    const user = await this.buildAuthUser(userId);
    if (user.role !== 'clinic') {
      throw new AppError('FORBIDDEN', 'Clinic role required', 403);
    }
    return user;
  }

  /** DEV-only: last OTP for an email (never in production). */
  async getDevLastOtp(emailRaw: string): Promise<string | null> {
    if (this.config.get<string>('app.nodeEnv') === 'production') return null;
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: `dev:otp:${normalizeEmail(emailRaw)}` },
    });
    if (!setting) return null;
    const value = setting.value as { code?: string };
    return value.code ?? null;
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  private async createSession(
    userId: string,
    meta: SessionMeta = {},
  ): Promise<AuthSessionDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        clinicMemberships: { where: { isActive: true }, take: 1 },
        doctorProfile: {
          include: {
            clinics: { where: { isActive: true }, take: 1 },
          },
        },
      },
    });
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    let clinicId = user.clinicMemberships[0]?.clinicId ?? null;
    if (!clinicId && user.doctorProfile?.clinics[0]) {
      clinicId = user.doctorProfile.clinics[0].clinicId;
    }
    const roles = user.roles.map((r) => r.role);

    const accessTtl = this.config.get<string>('app.jwt.accessTtl') ?? '15m';
    const refreshTtl = this.config.get<string>('app.jwt.refreshTtl') ?? '30d';

    const accessToken = await this.jwt.signAsync(
      {
        sub: userId,
        clinicId,
        roles,
        type: 'access',
      } satisfies JwtPayload,
      {
        secret: this.config.get<string>('app.jwt.accessSecret'),
        expiresIn: accessTtl as `${number}m` | `${number}d` | `${number}h`,
      },
    );

    const refreshToken = await this.jwt.signAsync(
      {
        sub: userId,
        clinicId,
        roles,
        type: 'refresh',
        jti: randomUUID(),
      } as JwtPayload & { jti: string },
      {
        secret: this.config.get<string>('app.jwt.refreshSecret'),
        expiresIn: refreshTtl as `${number}m` | `${number}d` | `${number}h`,
      },
    );

    const refreshDays = this.parseTtlToDays(refreshTtl);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: addDays(new Date(), refreshDays),
        userAgent: meta.userAgent?.slice(0, 512),
        ip: meta.ip?.slice(0, 64),
        deviceName: meta.deviceName?.slice(0, 128),
        platform: meta.platform?.slice(0, 32),
        lastUsedAt: new Date(),
      },
    });

    const decoded = this.jwt.decode(accessToken) as { exp?: number };
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000).toISOString()
      : addMinutes(new Date(), 15).toISOString();

    return {
      accessToken,
      refreshToken,
      expiresAt,
      user: await this.buildAuthUser(userId),
    };
  }

  private async buildAuthUser(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        patientProfile: true,
        doctorProfile: {
          include: {
            clinics: {
              where: { isActive: true },
              include: { clinic: true },
              take: 1,
            },
          },
        },
        clinicMemberships: {
          where: { isActive: true },
          include: { clinic: { include: { subscription: true } } },
          take: 1,
        },
      },
    });
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    const roleNames = user.roles.map((r) => r.role);
    if (
      roleNames.includes(UserRole.CLINIC_OWNER) ||
      roleNames.includes(UserRole.CLINIC_ADMIN) ||
      roleNames.includes(UserRole.RECEPTIONIST) ||
      roleNames.includes(UserRole.ACCOUNTANT)
    ) {
      return this.buildClinicAuthUserFromLoaded(user);
    }
    if (roleNames.includes(UserRole.DOCTOR) && user.doctorProfile) {
      const link = user.doctorProfile.clinics[0];
      return {
        id: user.id,
        role: 'doctor',
        doctorId: user.doctorProfile.id,
        clinicId: link?.clinicId ?? null,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email ?? '',
        phone: user.phone ?? '',
        specialty: user.doctorProfile.specialty ?? '',
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      };
    }
    if (roleNames.includes(UserRole.PATIENT) && user.patientProfile) {
      return {
        id: user.id,
        role: 'patient',
        patientId: user.patientProfile.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone ?? '',
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
        phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      };
    }

    return this.buildClinicAuthUserFromLoaded(user);
  }

  private async buildClinicAuthUser(userId: string): Promise<ClinicAuthUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        clinicMemberships: {
          where: { isActive: true },
          include: { clinic: { include: { subscription: true } } },
          take: 1,
        },
      },
    });
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
    return this.buildClinicAuthUserFromLoaded(user);
  }

  private buildClinicAuthUserFromLoaded(
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      emailVerifiedAt: Date | null;
      createdAt: Date;
      clinicMemberships: {
        clinic: {
          name: string;
          accountStatus: ClinicAccountStatus;
          onboardingCompleted: boolean;
          onboardingStep: number;
          subscription: {
            id: string;
            status: SubscriptionStatus;
            trialStartedAt: Date | null;
            trialEndsAt: Date | null;
            subscriptionStartedAt: Date | null;
            subscriptionEndsAt: Date | null;
            marketplaceBookingEnabled: boolean;
          } | null;
        };
      }[];
    },
  ): ClinicAuthUserDto {
    const membership = user.clinicMemberships[0];
    if (!membership) {
      throw new AppError('NOT_FOUND', 'Clinic membership not found', 404);
    }
    const clinic = membership.clinic;
    const sub = clinic.subscription;

    let status: ClinicAuthUserDto['subscription']['status'] = 'trial';
    if (sub) {
      if (
        sub.status === SubscriptionStatus.TRIAL &&
        sub.trialEndsAt &&
        sub.trialEndsAt < new Date()
      ) {
        status = 'expired';
        void this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: SubscriptionStatus.EXPIRED,
            marketplaceBookingEnabled: false,
          },
        });
      } else {
        status = this.mapSubStatus(sub.status);
      }
    }

    return {
      id: user.id,
      role: 'clinic',
      clinicName: clinic.name,
      adminFirstName: user.firstName,
      adminLastName: user.lastName,
      email: user.email ?? '',
      phone: user.phone ?? '',
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      accountStatus: this.mapAccountStatus(clinic.accountStatus),
      subscription: {
        status,
        trialStartedAt: sub?.trialStartedAt?.toISOString() ?? null,
        trialEndsAt: sub?.trialEndsAt?.toISOString() ?? null,
        subscriptionStartedAt:
          sub?.subscriptionStartedAt?.toISOString() ?? null,
        subscriptionEndsAt: sub?.subscriptionEndsAt?.toISOString() ?? null,
        marketplaceBookingEnabled: sub?.marketplaceBookingEnabled ?? false,
      },
      onboardingCompleted: clinic.onboardingCompleted,
      onboardingStep: clinic.onboardingStep,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private mapAccountStatus(
    s: ClinicAccountStatus,
  ): ClinicAuthUserDto['accountStatus'] {
    switch (s) {
      case ClinicAccountStatus.PENDING_VERIFICATION:
        return 'pending_verification';
      case ClinicAccountStatus.BLOCKED:
        return 'blocked';
      default:
        return 'active';
    }
  }

  private mapSubStatus(
    s: SubscriptionStatus,
  ): ClinicAuthUserDto['subscription']['status'] {
    switch (s) {
      case SubscriptionStatus.ACTIVE:
        return 'active';
      case SubscriptionStatus.EXPIRED:
      case SubscriptionStatus.CANCELLED:
        return 'expired';
      case SubscriptionStatus.BLOCKED:
        return 'blocked';
      default:
        return 'trial';
    }
  }

  private async issueOtp(
    email: string,
    purpose: OtpPurpose,
    userId?: string,
  ): Promise<number> {
    const cooldown =
      this.config.get<number>('app.otp.resendCooldownSeconds') ?? 60;
    const ttlMinutes = this.config.get<number>('app.otp.ttlMinutes') ?? 10;
    const maxAttempts = this.config.get<number>('app.otp.maxAttempts') ?? 5;

    const latest = await this.prisma.otpCode.findFirst({
      where: { email, purpose, consumedAt: null },
      orderBy: { lastSentAt: 'desc' },
    });
    if (latest) {
      const elapsed = (Date.now() - latest.lastSentAt.getTime()) / 1000;
      if (elapsed < cooldown) {
        const wait = Math.ceil(cooldown - elapsed);
        throw new AppError(
          'RESEND_COOLDOWN',
          `Please wait ${wait}s before resending`,
          429,
          { seconds: wait },
        );
      }
    }

    const code = String(randomInt(100000, 999999));
    const codeHash = await argon2.hash(code);

    await this.prisma.otpCode.updateMany({
      where: { email, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    await this.prisma.otpCode.create({
      data: {
        email,
        purpose,
        codeHash,
        userId,
        expiresAt: addMinutes(new Date(), ttlMinutes),
        maxAttempts,
        lastSentAt: new Date(),
      },
    });

    if (this.config.get<string>('app.nodeEnv') !== 'production') {
      await this.prisma.systemSetting.upsert({
        where: { key: `dev:otp:${email}` },
        create: { key: `dev:otp:${email}`, value: { code, purpose } },
        update: { value: { code, purpose } },
      });
    }

    if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
      await this.mail.sendVerificationOtp(email, code);
    } else {
      await this.mail.sendPasswordResetOtp(email, code);
    }

    return cooldown;
  }

  private async verifyOtpOnly(
    email: string,
    purpose: OtpPurpose,
    code: string,
  ) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { email, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new AppError('INVALID_CODE', 'Invalid code', 400);
    if (otp.expiresAt < new Date()) {
      throw new AppError('CODE_EXPIRED', 'Code expired', 400);
    }
    if (otp.attempts >= otp.maxAttempts) {
      throw new AppError('RATE_LIMITED', 'Too many attempts', 429);
    }
    const ok = await argon2.verify(otp.codeHash, code);
    if (!ok) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AppError('INVALID_CODE', 'Invalid code', 400);
    }
    return otp;
  }

  private async consumeOtp(
    email: string,
    purpose: OtpPurpose,
    code: string,
  ) {
    const otp = await this.verifyOtpOnly(email, purpose, code);
    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseTtlToDays(ttl: string): number {
    const m = /^(\d+)([dhms])$/.exec(ttl);
    if (!m) return 30;
    const n = parseInt(m[1], 10);
    switch (m[2]) {
      case 'd':
        return n;
      case 'h':
        return Math.max(1, Math.ceil(n / 24));
      default:
        return 30;
    }
  }

  private async uniqueClinicSlug(base: string): Promise<string> {
    let slug = base;
    let i = 0;
    while (await this.prisma.clinic.findUnique({ where: { slug } })) {
      i += 1;
      slug = `${base}-${i}`;
    }
    return slug;
  }

  toAuthUser(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      clinicId: payload.clinicId,
      roles: payload.roles,
    };
  }
}
