export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'blocked';

export type ClinicAccountStatus = 'pending_verification' | 'active' | 'blocked';

export interface ClinicSubscription {
  status: SubscriptionStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;
  marketplaceBookingEnabled: boolean;
}

export interface ClinicAuthUser {
  id: string;
  clinicId?: string | null;
  membershipId?: string | null;
  clinicName: string;
  adminFirstName: string;
  adminLastName: string;
  email: string;
  phone: string;
  emailVerifiedAt: string | null;
  accountStatus: ClinicAccountStatus;
  subscription: ClinicSubscription;
  onboardingCompleted: boolean;
  onboardingStep: number;
  createdAt: string;
  mustChangePassword?: boolean;
}

export interface WorkspaceDto {
  clinicId: string;
  clinicName: string;
  membershipId: string;
  role: string;
  isActive: boolean;
  permissions?: string[];
}

export interface RegisterClinicInput {
  clinicName: string;
  adminFirstName: string;
  adminLastName: string;
  phone: string;
  email: string;
  password: string;
  acceptTerms: boolean;
  termsVersion?: string;
  privacyVersion?: string;
  locale?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: ClinicAuthUser;
  requiresWorkspaceSelection?: boolean;
  workspaces?: WorkspaceDto[];
  activeWorkspace?: WorkspaceDto | null;
}

export interface LoginResult {
  session: AuthSession | null;
  requiresEmailVerification: boolean;
  email?: string;
  requiresWorkspaceSelection?: boolean;
}

export interface VerifyEmailInput {
  email: string;
  code: string;
}

export interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePhoneInput {
  phone: string;
  currentPassword: string;
}

export interface RequestEmailChangeInput {
  newEmail: string;
  currentPassword: string;
}

export interface ConfirmEmailChangeInput {
  newEmail: string;
  code: string;
}

export interface SubscriptionStatusDto {
  status: SubscriptionStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  daysRemaining: number | null;
  marketplaceBookingEnabled: boolean;
}

export type AuthErrorCode =
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'INVALID_PASSWORD'
  | 'PASSWORD_MISMATCH'
  | 'TERMS_REQUIRED'
  | 'LEGAL_CONSENT_REQUIRED'
  | 'EMAIL_TAKEN'
  | 'PHONE_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'EMAIL_NOT_REGISTERED'
  | 'INVALID_CODE'
  | 'CODE_EXPIRED'
  | 'RESEND_COOLDOWN'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'NOT_CLINIC_ACCOUNT'
  | 'WRONG_PASSWORD'
  | 'SAME_PASSWORD'
  | 'SAME_EMAIL'
  | 'UNAUTHORIZED'
  | 'NETWORK'
  | 'UNKNOWN';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly meta?: Record<string, unknown>;

  constructor(code: AuthErrorCode, message?: string, meta?: Record<string, unknown>) {
    super(message ?? code);
    this.name = 'AuthError';
    this.code = code;
    this.meta = meta;
  }
}

export interface AuthService {
  registerClinic(input: RegisterClinicInput): Promise<{ email: string; resendAvailableIn: number }>;
  verifyEmail(input: VerifyEmailInput): Promise<AuthSession>;
  resendVerificationCode(email: string): Promise<{ resendAvailableIn: number }>;
  login(identifier: string, password: string): Promise<LoginResult>;
  logout(): Promise<void>;
  forgotPassword(email: string): Promise<{ resendAvailableIn: number }>;
  verifyResetCode(email: string, code: string): Promise<{ resetToken: string }>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
  getCurrentUser(): Promise<ClinicAuthUser | null>;
  getSubscriptionStatus(): Promise<SubscriptionStatusDto | null>;
  updateOnboarding(step: number, completed?: boolean): Promise<ClinicAuthUser>;
  changePassword(input: ChangePasswordInput): Promise<ClinicAuthUser>;
  changePhone(input: ChangePhoneInput): Promise<ClinicAuthUser>;
  /** Sends a code to the new address; the email itself changes only after confirmEmailChange. */
  requestEmailChange(
    input: RequestEmailChangeInput,
  ): Promise<{ email: string; resendAvailableIn: number }>;
  confirmEmailChange(input: ConfirmEmailChangeInput): Promise<ClinicAuthUser>;
  /** Saves the UI language server-side so push notifications use it. */
  updateLocale?(locale: string): Promise<void>;
  switchWorkspace?(clinicId: string): Promise<AuthSession>;
  getWorkspaces?(): Promise<WorkspaceDto[]>;
  getActivePermissions?(): string[];
  /** DEV-only helper; no-ops on real API */
  getDevLastOtp?(email: string): string | null;
}
