import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppError } from '../common/filters/global-exception.filter';
import type { AuthUser } from '../common/guards/auth.guards';
import { Public } from '../common/guards/auth.guards';
import { AuthService, type SessionMeta } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  OnboardingDto,
  RefreshTokenDto,
  RegisterClinicDto,
  ResendEmailDto,
  RegisterPatientDto,
  ResetPasswordDto,
  CheckEmailDto,
  UpdatePatientProfileDto,
  VerifyEmailDto,
  VerifyResetCodeDto,
} from './dto/auth.dto';

function sessionMetaFromRequest(req: Request): SessionMeta {
  const ua = req.headers['user-agent'];
  const xf = req.headers['x-forwarded-for'];
  const ip =
    (typeof xf === 'string' ? xf.split(',')[0]?.trim() : undefined) ||
    req.ip ||
    req.socket?.remoteAddress;
  const deviceName =
    (req.body as { deviceName?: string } | undefined)?.deviceName ||
    (req.headers['x-device-name'] as string | undefined);
  const platform =
    (req.body as { platform?: string } | undefined)?.platform ||
    (req.headers['x-device-platform'] as string | undefined);
  return {
    userAgent: typeof ua === 'string' ? ua : undefined,
    ip,
    deviceName,
    platform,
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('clinic/register')
  register(@Body() dto: RegisterClinicDto) {
    return this.auth.registerClinic(dto);
  }

  @Public()
  @Post('email/verify')
  verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) {
    return this.auth.verifyEmail(dto).then(async (session) => {
      // verifyEmail already creates session; re-issue with meta if needed
      void req;
      return session;
    });
  }

  @Public()
  @Post('email/resend')
  resend(@Body() dto: ResendEmailDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('check-email')
  @HttpCode(200)
  checkEmail(@Body() dto: CheckEmailDto) {
    return this.auth.checkEmail(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('patient/register')
  registerPatient(@Body() dto: RegisterPatientDto, @Req() req: Request) {
    return this.auth.registerPatient(dto, sessionMetaFromRequest(req));
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('patient/verify-email')
  verifyPatientEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) {
    return this.auth.verifyPatientEmail(dto, sessionMetaFromRequest(req));
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('patient/resend-verification')
  resendPatientVerification(@Body() dto: ResendEmailDto) {
    return this.auth.resendPatientVerification(dto.email);
  }

  @ApiBearerAuth()
  @Patch('patient/profile')
  updatePatientProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePatientProfileDto,
  ) {
    return this.auth.updatePatientProfile(user.id, dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, sessionMetaFromRequest(req));
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(204)
  async logout(
    @CurrentUser() user: AuthUser,
    @Body() body: RefreshTokenDto = {},
  ) {
    await this.auth.logout(user.id, body.refreshToken);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    if (!dto.refreshToken) {
      throw new AppError('UNAUTHORIZED', 'Refresh token required', 401);
    }
    return this.auth.refresh(dto.refreshToken, sessionMetaFromRequest(req));
  }

  @Public()
  @Post('forgot-password')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password/verify')
  verifyReset(@Body() dto: VerifyResetCodeDto) {
    return this.auth.verifyResetCode(dto.email, dto.code);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(204)
  async reset(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.getCurrentUser(user.id, user.membershipId, user.clinicId);
  }

  @ApiBearerAuth()
  @Post('workspace/switch')
  switchWorkspace(
    @CurrentUser() user: AuthUser,
    @Body() body: { clinicId: string },
    @Req() req: Request,
  ) {
    if (!body?.clinicId) {
      throw new AppError('VALIDATION_ERROR', 'clinicId required', 400);
    }
    return this.auth.switchWorkspace(
      user.id,
      body.clinicId,
      sessionMetaFromRequest(req),
    );
  }

  @ApiBearerAuth()
  @Patch('onboarding')
  onboarding(@CurrentUser() user: AuthUser, @Body() dto: OnboardingDto) {
    return this.auth.updateOnboarding(user.id, dto, user.clinicId);
  }

  @ApiBearerAuth()
  @Get('sessions')
  sessions(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Query('refreshToken') refreshToken?: string,
  ) {
    const headerToken = req.headers['x-refresh-token'];
    const token =
      refreshToken ||
      (typeof headerToken === 'string' ? headerToken : undefined);
    return this.auth.listSessions(user.id, token);
  }

  @ApiBearerAuth()
  @Delete('sessions/:id')
  revokeSession(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.auth.revokeSession(user.id, id);
  }

  @ApiBearerAuth()
  @Post('sessions/revoke-all-others')
  revokeOthers(
    @CurrentUser() user: AuthUser,
    @Body() body: RefreshTokenDto = {},
  ) {
    return this.auth.revokeAllOtherSessions(user.id, body.refreshToken);
  }

  /** DEV only — returns last OTP when NODE_ENV !== production */
  @Public()
  @Get('dev/last-otp')
  async devLastOtp(@Query('email') email: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('NOT_FOUND', 'Not found', 404);
    }
    return { code: await this.auth.getDevLastOtp(email) };
  }
}
