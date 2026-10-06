'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthCard, AuthShell } from '@/components/auth/AuthShell';
import { AuthButton, AuthField, AuthLinkRow, PasswordField } from '@/components/auth/AuthFields';
import { mapAuthError, useAuth } from '@/components/providers/AuthProvider';
import { safeNextPath } from '@/lib/auth/next-path';
import { looksLikeEmail, maskUzPhoneInput, normalizeLoginIdentifier } from '@/lib/auth/phone';

/** Only the characters a phone number can contain; anything else means the user is typing an email. */
const PHONE_INPUT = /^[\d+\s()-]+$/;

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const { login, resendVerificationCode } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(
    params.get('unverified') || null,
  );
  const [resendLoading, setResendLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setUnverifiedEmail(null);
    const trimmed = identifier.trim();
    if (!trimmed) {
      setError(t('clinicAuth.errors.identifier_required'));
      return;
    }
    const normalized = normalizeLoginIdentifier(trimmed);
    if (!normalized) {
      setError(
        looksLikeEmail(trimmed) || !/\d/.test(trimmed)
          ? t('clinicAuth.errors.invalid_email')
          : t('clinicAuth.errors.invalid_phone'),
      );
      return;
    }
    if (!password) {
      setError(t('clinicAuth.errors.password_required'));
      return;
    }
    setLoading(true);
    try {
      const result = await login(normalized.value, password);
      if (result.requiresEmailVerification) {
        setUnverifiedEmail(result.email ?? null);
        return;
      }
      if (
        result.requiresWorkspaceSelection ||
        result.session?.requiresWorkspaceSelection ||
        ((result.session?.workspaces?.length ?? 0) > 1 && !result.session?.activeWorkspace)
      ) {
        router.replace('/select-workspace');
        return;
      }
      const user = result.session?.user;
      if (user && !user.onboardingCompleted) {
        router.replace('/onboarding');
      } else if (user?.subscription.status === 'expired') {
        router.replace('/overview?expired=1');
      } else {
        router.replace(safeNextPath(params.get('next')) ?? '/overview');
      }
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  async function sendVerify() {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    setError('');
    try {
      const r = await resendVerificationCode(unverifiedEmail);
      sessionStorage.setItem(
        'denta.verify.email',
        JSON.stringify({ email: unverifiedEmail, cooldown: r.resendAvailableIn }),
      );
      router.push(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <AuthShell
      footer={
        <AuthLinkRow>
          {t('clinicAuth.login.no_account')}{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            {t('clinicAuth.login.start_trial')}
          </Link>
        </AuthLinkRow>
      }
    >
      <AuthCard title={t('clinicAuth.login.title')} subtitle={t('clinicAuth.login.subtitle')}>
        <form onSubmit={onSubmit} className="space-y-4">
          <AuthField
            label={t('clinicAuth.login.identifier')}
            value={identifier}
            onChange={(e) => {
              const v = e.target.value;
              if (!looksLikeEmail(v) && PHONE_INPUT.test(v) && /\d/.test(v)) {
                setIdentifier(maskUzPhoneInput(v));
              } else {
                setIdentifier(v);
              }
            }}
            autoComplete="username"
            placeholder={t('clinicAuth.login.identifier_placeholder')}
          />
          <PasswordField
            label={t('clinicAuth.login.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            showLabel={t('clinicAuth.show_password')}
            hideLabel={t('clinicAuth.hide_password')}
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t('clinicAuth.login.forgot')}
            </Link>
          </div>

          {unverifiedEmail ? (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              <p className="font-medium">{t('clinicAuth.login.unverified_title')}</p>
              <p className="text-amber-800/90">{t('clinicAuth.login.unverified_body')}</p>
              <AuthButton
                type="button"
                loading={resendLoading}
                onClick={() => void sendVerify()}
                className="bg-amber-600 shadow-amber-600/20 hover:bg-amber-700"
              >
                {t('clinicAuth.login.send_code')}
              </AuthButton>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <AuthButton type="submit" loading={loading}>
            {t('clinicAuth.login.cta')}
          </AuthButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginForm />
    </Suspense>
  );
}
