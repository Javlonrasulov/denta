'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthCard, AuthShell } from '@/components/auth/AuthShell';
import { AuthButton, AuthField, AuthLinkRow, PasswordField } from '@/components/auth/AuthFields';
import { OtpInput } from '@/components/auth/OtpInput';
import { mapAuthError, useAuth } from '@/components/providers/AuthProvider';
import { isStrongPassword } from '@/lib/auth/password';
import { isValidEmail, normalizeEmail } from '@/lib/auth/phone';

type Step = 'email' | 'code' | 'password' | 'done';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { forgotPassword, resetPassword, service, isMock } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [devHint, setDevHint] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (!isMock || step !== 'code' || !email) return;
    setDevHint(service.getDevLastOtp?.(email) ?? null);
  }, [isMock, step, email, service, cooldown]);

  async function sendCode() {
    setError('');
    if (!isValidEmail(email)) {
      setError(t('clinicAuth.errors.invalid_email'));
      return;
    }
    setLoading(true);
    try {
      const r = await forgotPassword(normalizeEmail(email));
      setCooldown(r.resendAvailableIn);
      setStep('code');
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  async function goPassword() {
    setError('');
    if (code.length !== 6) {
      setError(t('clinicAuth.errors.invalid_code'));
      return;
    }
    setStep('password');
  }

  async function submitPassword() {
    setError('');
    if (!isStrongPassword(password)) {
      setError(t('clinicAuth.errors.invalid_password'));
      return;
    }
    if (password !== confirm) {
      setError(t('clinicAuth.errors.password_mismatch'));
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        email: normalizeEmail(email),
        code,
        newPassword: password,
      });
      setStep('done');
    } catch (err) {
      setError(mapAuthError(err, t));
      if (err && typeof err === 'object' && 'code' in err) {
        const c = (err as { code: string }).code;
        if (c === 'INVALID_CODE' || c === 'CODE_EXPIRED') setStep('code');
      }
    } finally {
      setLoading(false);
    }
  }

  const mm = String(Math.floor(cooldown / 60)).padStart(2, '0');
  const ss = String(cooldown % 60).padStart(2, '0');

  return (
    <AuthShell
      footer={
        <AuthLinkRow>
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t('clinicAuth.forgot.back_login')}
          </Link>
        </AuthLinkRow>
      }
    >
      <AuthCard
        title={
          step === 'done'
            ? t('clinicAuth.forgot.done_title')
            : t('clinicAuth.forgot.title')
        }
        subtitle={
          step === 'done'
            ? t('clinicAuth.forgot.done_subtitle')
            : step === 'email'
              ? t('clinicAuth.forgot.subtitle')
              : step === 'code'
                ? t('clinicAuth.forgot.code_subtitle', { email })
                : t('clinicAuth.forgot.password_subtitle')
        }
      >
        <div className="space-y-4">
          {step === 'email' ? (
            <>
              <AuthField
                label={t('clinicAuth.register.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <AuthButton type="button" loading={loading} onClick={() => void sendCode()}>
                {t('clinicAuth.forgot.send_code')}
              </AuthButton>
            </>
          ) : null}

          {step === 'code' ? (
            <>
              <OtpInput value={code} onChange={setCode} error={Boolean(error)} />
              {devHint ? (
                <p className="rounded-lg bg-slate-100 px-3 py-2 text-center text-xs text-slate-500">
                  {t('clinicAuth.verify.dev_hint', { code: devHint })}
                </p>
              ) : null}
              <AuthButton type="button" onClick={() => void goPassword()}>
                {t('clinicAuth.forgot.continue')}
              </AuthButton>
              <AuthButton
                type="button"
                variant="secondary"
                disabled={cooldown > 0 || loading}
                onClick={() => void sendCode()}
              >
                {cooldown > 0
                  ? t('clinicAuth.verify.resend_in', { time: `${mm}:${ss}` })
                  : t('clinicAuth.verify.resend')}
              </AuthButton>
            </>
          ) : null}

          {step === 'password' ? (
            <>
              <PasswordField
                label={t('clinicAuth.forgot.new_password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                showLabel={t('clinicAuth.show_password')}
                hideLabel={t('clinicAuth.hide_password')}
              />
              <PasswordField
                label={t('clinicAuth.forgot.confirm_password')}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                showLabel={t('clinicAuth.show_password')}
                hideLabel={t('clinicAuth.hide_password')}
              />
              <AuthButton type="button" loading={loading} onClick={() => void submitPassword()}>
                {t('clinicAuth.forgot.save')}
              </AuthButton>
            </>
          ) : null}

          {step === 'done' ? (
            <AuthButton type="button" onClick={() => router.replace('/login')}>
              {t('clinicAuth.forgot.go_login')}
            </AuthButton>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </AuthCard>
    </AuthShell>
  );
}
