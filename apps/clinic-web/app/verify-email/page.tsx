'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthCard, AuthShell } from '@/components/auth/AuthShell';
import { AuthButton, AuthLinkRow } from '@/components/auth/AuthFields';
import { OtpInput } from '@/components/auth/OtpInput';
import { mapAuthError, useAuth } from '@/components/providers/AuthProvider';
import { isAuthMockMode } from '@/lib/auth';

function VerifyEmailForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const { verifyEmail, resendVerificationCode, isMock, service } = useAuth();

  const emailParam = params.get('email') ?? '';
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [devHint, setDevHint] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    try {
      const raw = sessionStorage.getItem('denta.verify.email');
      if (raw) {
        const parsed = JSON.parse(raw) as { email?: string; cooldown?: number };
        if (parsed.email && !emailParam) setEmail(parsed.email);
        if (parsed.cooldown) setCooldown(parsed.cooldown);
      }
    } catch {
      /* ignore */
    }
  }, [emailParam]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (!isMock || !email) return;
    const tip = service.getDevLastOtp?.(email) ?? null;
    setDevHint(tip);
  }, [isMock, email, service, cooldown]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (code.length !== 6) {
      setError(t('clinicAuth.errors.invalid_code'));
      return;
    }
    setLoading(true);
    try {
      await verifyEmail({ email, code });
      router.replace('/verify-success');
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (cooldown > 0 || !email) return;
    setError('');
    try {
      const r = await resendVerificationCode(email);
      setCooldown(r.resendAvailableIn);
      setCode('');
    } catch (err) {
      setError(mapAuthError(err, t));
    }
  }

  const mm = String(Math.floor(cooldown / 60)).padStart(2, '0');
  const ss = String(cooldown % 60).padStart(2, '0');

  return (
    <AuthShell
      footer={
        <AuthLinkRow>
          <Link href="/register" className="font-semibold text-primary hover:underline">
            {t('clinicAuth.verify.change_email')}
          </Link>
        </AuthLinkRow>
      }
    >
      <AuthCard
        title={t('clinicAuth.verify.title')}
        subtitle={t('clinicAuth.verify.subtitle', { email })}
      >
        <form onSubmit={onSubmit} className="space-y-5">
          <OtpInput value={code} onChange={setCode} error={Boolean(error)} disabled={loading} />

          {isAuthMockMode() && devHint ? (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-center text-xs text-slate-500">
              {t('clinicAuth.verify.dev_hint', { code: devHint })}
            </p>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <AuthButton type="submit" loading={loading}>
            {t('clinicAuth.verify.cta')}
          </AuthButton>

          <AuthButton
            type="button"
            variant="secondary"
            disabled={cooldown > 0}
            onClick={() => void onResend()}
          >
            {cooldown > 0
              ? t('clinicAuth.verify.resend_in', { time: `${mm}:${ss}` })
              : t('clinicAuth.verify.resend')}
          </AuthButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
