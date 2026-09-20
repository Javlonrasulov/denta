import { addDaysIso, daysRemaining, generateOtp6, generateToken, sha256 } from './crypto';
import { isStrongPassword } from './password';
import {
  isValidEmail,
  isValidUzPhone,
  normalizeEmail,
  normalizeLoginIdentifier,
  normalizeUzPhone,
} from './phone';
import {
  ACCOUNTS_STORAGE_KEY,
  clearPersistedSession,
  persistSession,
  readPersistedSession,
  updatePersistedUser,
} from './session';
import {
  AuthError,
  type AuthService,
  type AuthSession,
  type ClinicAuthUser,
  type RegisterClinicInput,
  type ResetPasswordInput,
  type SubscriptionStatusDto,
  type VerifyEmailInput,
} from './types';

const TRIAL_DAYS = 30;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_SEC = 60;
const MAX_VERIFY_ATTEMPTS = 8;

interface StoredOtp {
  hash: string;
  expiresAt: string;
  purpose: 'verify_email' | 'reset_password';
  attempts: number;
  /** DEV only — never sent to production API */
  plainDev?: string;
}

interface StoredAccount {
  user: ClinicAuthUser;
  passwordHash: string;
  otp: StoredOtp | null;
  lastOtpSentAt: string | null;
  resetTokenHash: string | null;
  resetTokenExpiresAt: string | null;
}

function delay(ms = 350): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function loadAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredAccount[];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

function findByEmail(email: string): StoredAccount | undefined {
  const e = normalizeEmail(email);
  return loadAccounts().find((a) => a.user.email === e);
}

function findByPhone(phone: string): StoredAccount | undefined {
  return loadAccounts().find((a) => a.user.phone === phone);
}

function findById(id: string): StoredAccount | undefined {
  return loadAccounts().find((a) => a.user.id === id);
}

function upsert(account: StoredAccount): void {
  const all = loadAccounts();
  const idx = all.findIndex((a) => a.user.id === account.user.id);
  if (idx >= 0) all[idx] = account;
  else all.push(account);
  saveAccounts(all);
}

function logDevOtp(email: string, code: string, purpose: string): void {
  if (process.env.NODE_ENV === 'production') return;
  // eslint-disable-next-line no-console
  console.info(
    `[DENTA.UZ DEV] Email OTP (${purpose}) → ${email}: ${code} (valid 10 min)`,
  );
}

async function issueOtp(
  account: StoredAccount,
  purpose: StoredOtp['purpose'],
): Promise<{ resendAvailableIn: number }> {
  const now = Date.now();
  if (account.lastOtpSentAt) {
    const elapsed = (now - new Date(account.lastOtpSentAt).getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SEC) {
      throw new AuthError('RESEND_COOLDOWN', undefined, {
        seconds: Math.ceil(RESEND_COOLDOWN_SEC - elapsed),
      });
    }
  }

  const code = generateOtp6();
  const hash = await sha256(`${purpose}:${account.user.email}:${code}`);
  account.otp = {
    hash,
    expiresAt: new Date(now + OTP_TTL_MS).toISOString(),
    purpose,
    attempts: 0,
    plainDev: process.env.NODE_ENV === 'production' ? undefined : code,
  };
  account.lastOtpSentAt = new Date(now).toISOString();
  account.resetTokenHash = null;
  account.resetTokenExpiresAt = null;
  upsert(account);
  logDevOtp(account.user.email, code, purpose);
  return { resendAvailableIn: RESEND_COOLDOWN_SEC };
}

async function createSession(user: ClinicAuthUser): Promise<AuthSession> {
  const accessToken = generateToken();
  const refreshToken = generateToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const session: AuthSession = { accessToken, refreshToken, expiresAt, user };
  persistSession(session);
  return session;
}

function refreshSubscription(user: ClinicAuthUser): ClinicAuthUser {
  const sub = { ...user.subscription };
  if (sub.status === 'trial' && sub.trialEndsAt) {
    if (new Date(sub.trialEndsAt).getTime() <= Date.now()) {
      sub.status = 'expired';
      sub.marketplaceBookingEnabled = false;
    }
  }
  if (sub.status === 'active' && sub.subscriptionEndsAt) {
    if (new Date(sub.subscriptionEndsAt).getTime() <= Date.now()) {
      sub.status = 'expired';
      sub.marketplaceBookingEnabled = false;
    }
  }
  return { ...user, subscription: sub };
}

export function createMockAuthService(): AuthService {
  return {
    async registerClinic(input: RegisterClinicInput) {
      await delay();
      if (!input.acceptTerms) throw new AuthError('TERMS_REQUIRED');
      const email = normalizeEmail(input.email);
      const phone = normalizeUzPhone(input.phone);
      if (!isValidEmail(email)) throw new AuthError('INVALID_EMAIL');
      if (!phone || !isValidUzPhone(phone)) throw new AuthError('INVALID_PHONE');
      if (!isStrongPassword(input.password)) throw new AuthError('INVALID_PASSWORD');
      if (!input.clinicName.trim() || !input.adminFirstName.trim() || !input.adminLastName.trim()) {
        throw new AuthError('UNKNOWN');
      }
      if (findByEmail(email)) throw new AuthError('EMAIL_TAKEN');
      if (findByPhone(phone)) throw new AuthError('PHONE_TAKEN');

      const now = new Date().toISOString();
      const user: ClinicAuthUser = {
        id: `clinic_${generateToken().slice(0, 12)}`,
        clinicName: input.clinicName.trim(),
        adminFirstName: input.adminFirstName.trim(),
        adminLastName: input.adminLastName.trim(),
        email,
        phone,
        emailVerifiedAt: null,
        accountStatus: 'pending_verification',
        subscription: {
          status: 'trial',
          trialStartedAt: null,
          trialEndsAt: null,
          subscriptionStartedAt: null,
          subscriptionEndsAt: null,
          marketplaceBookingEnabled: false,
        },
        onboardingCompleted: false,
        onboardingStep: 0,
        createdAt: now,
      };

      const account: StoredAccount = {
        user,
        passwordHash: await sha256(input.password),
        otp: null,
        lastOtpSentAt: null,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      };
      upsert(account);
      const { resendAvailableIn } = await issueOtp(account, 'verify_email');
      return { email, resendAvailableIn };
    },

    async verifyEmail(input: VerifyEmailInput) {
      await delay();
      const email = normalizeEmail(input.email);
      const account = findByEmail(email);
      if (!account) throw new AuthError('NOT_FOUND');
      const otp = account.otp;
      if (!otp || otp.purpose !== 'verify_email') throw new AuthError('INVALID_CODE');
      if (new Date(otp.expiresAt).getTime() < Date.now()) throw new AuthError('CODE_EXPIRED');
      if (otp.attempts >= MAX_VERIFY_ATTEMPTS) throw new AuthError('RATE_LIMITED');

      const hash = await sha256(`verify_email:${email}:${input.code.trim()}`);
      if (hash !== otp.hash) {
        otp.attempts += 1;
        account.otp = otp;
        upsert(account);
        throw new AuthError('INVALID_CODE');
      }

      const now = new Date();
      const trialEndsAt = addDaysIso(now, TRIAL_DAYS);
      account.user = {
        ...account.user,
        emailVerifiedAt: now.toISOString(),
        accountStatus: 'active',
        subscription: {
          status: 'trial',
          trialStartedAt: now.toISOString(),
          trialEndsAt,
          subscriptionStartedAt: null,
          subscriptionEndsAt: null,
          marketplaceBookingEnabled: true,
        },
      };
      account.otp = null;
      upsert(account);
      return createSession(account.user);
    },

    async resendVerificationCode(emailRaw: string) {
      await delay(200);
      const email = normalizeEmail(emailRaw);
      const account = findByEmail(email);
      if (!account) throw new AuthError('NOT_FOUND');
      if (account.user.emailVerifiedAt) throw new AuthError('UNKNOWN');
      return issueOtp(account, 'verify_email');
    },

    async login(identifier: string, password: string) {
      await delay();
      const parsed = normalizeLoginIdentifier(identifier);
      if (!parsed) throw new AuthError('INVALID_CREDENTIALS');
      if (!password) throw new AuthError('INVALID_CREDENTIALS');

      const account =
        parsed.kind === 'email' ? findByEmail(parsed.value) : findByPhone(parsed.value);
      if (!account) throw new AuthError('INVALID_CREDENTIALS');

      const hash = await sha256(password);
      if (hash !== account.passwordHash) throw new AuthError('INVALID_CREDENTIALS');

      if (!account.user.emailVerifiedAt || account.user.accountStatus === 'pending_verification') {
        return {
          session: null,
          requiresEmailVerification: true,
          email: account.user.email,
        };
      }

      account.user = refreshSubscription(account.user);
      upsert(account);
      const session = await createSession(account.user);
      return { session, requiresEmailVerification: false };
    },

    async logout() {
      await delay(100);
      clearPersistedSession();
    },

    async forgotPassword(emailRaw: string) {
      await delay();
      const email = normalizeEmail(emailRaw);
      if (!isValidEmail(email)) throw new AuthError('INVALID_EMAIL');
      const account = findByEmail(email);
      // Don't leak existence in production; for DEV still send if exists
      if (!account) {
        return { resendAvailableIn: RESEND_COOLDOWN_SEC };
      }
      return issueOtp(account, 'reset_password');
    },

    async verifyResetCode(emailRaw: string, code: string) {
      await delay();
      const email = normalizeEmail(emailRaw);
      const account = findByEmail(email);
      if (!account) throw new AuthError('INVALID_CODE');
      const otp = account.otp;
      if (!otp || otp.purpose !== 'reset_password') throw new AuthError('INVALID_CODE');
      if (new Date(otp.expiresAt).getTime() < Date.now()) throw new AuthError('CODE_EXPIRED');
      const hash = await sha256(`reset_password:${email}:${code.trim()}`);
      if (hash !== otp.hash) {
        otp.attempts += 1;
        account.otp = otp;
        upsert(account);
        throw new AuthError('INVALID_CODE');
      }
      const resetToken = generateToken();
      account.resetTokenHash = await sha256(resetToken);
      account.resetTokenExpiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
      account.otp = null;
      upsert(account);
      return { resetToken };
    },

    async resetPassword(input: ResetPasswordInput) {
      await delay();
      const email = normalizeEmail(input.email);
      if (!isStrongPassword(input.newPassword)) throw new AuthError('INVALID_PASSWORD');
      const account = findByEmail(email);
      if (!account) throw new AuthError('NOT_FOUND');

      // Prefer one-shot flow: verify code then set password in same call if no prior reset token
      const otp = account.otp;
      if (otp && otp.purpose === 'reset_password') {
        if (new Date(otp.expiresAt).getTime() < Date.now()) throw new AuthError('CODE_EXPIRED');
        const hash = await sha256(`reset_password:${email}:${input.code.trim()}`);
        if (hash !== otp.hash) throw new AuthError('INVALID_CODE');
        account.otp = null;
      } else {
        throw new AuthError('INVALID_CODE');
      }

      account.passwordHash = await sha256(input.newPassword);
      account.resetTokenHash = null;
      account.resetTokenExpiresAt = null;
      upsert(account);
      clearPersistedSession();
    },

    async getCurrentUser() {
      await delay(80);
      const session = readPersistedSession();
      if (!session) return null;
      const account = findById(session.user.id);
      if (!account) {
        clearPersistedSession();
        return null;
      }
      const user = refreshSubscription(account.user);
      if (user.subscription.status !== account.user.subscription.status) {
        account.user = user;
        upsert(account);
      }
      updatePersistedUser(user);
      return user;
    },

    async getSubscriptionStatus(): Promise<SubscriptionStatusDto | null> {
      const user = await this.getCurrentUser();
      if (!user) return null;
      const { subscription: s } = user;
      return {
        status: s.status,
        trialStartedAt: s.trialStartedAt,
        trialEndsAt: s.trialEndsAt,
        daysRemaining: daysRemaining(s.trialEndsAt ?? s.subscriptionEndsAt),
        marketplaceBookingEnabled: s.marketplaceBookingEnabled,
      };
    },

    async updateOnboarding(step: number, completed = false) {
      await delay(120);
      const session = readPersistedSession();
      if (!session) throw new AuthError('UNAUTHORIZED');
      const account = findById(session.user.id);
      if (!account) throw new AuthError('UNAUTHORIZED');
      account.user = {
        ...account.user,
        onboardingStep: Math.max(0, Math.min(6, step)),
        onboardingCompleted: completed || account.user.onboardingCompleted,
      };
      upsert(account);
      updatePersistedUser(account.user);
      return account.user;
    },

    getDevLastOtp(email: string) {
      if (process.env.NODE_ENV === 'production') return null;
      const account = findByEmail(email);
      return account?.otp?.plainDev ?? null;
    },
  };
}
