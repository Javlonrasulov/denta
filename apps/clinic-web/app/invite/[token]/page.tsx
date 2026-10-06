'use client';

import { Building2, CheckCircle2, MailWarning } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthButton, AuthLinkRow, PasswordField, PasswordStrengthBar } from '@/components/auth/AuthFields';
import { AuthCard, AuthShell } from '@/components/auth/AuthShell';
import { clinicApi, type ClinicInvitationPreview } from '@/lib/api/clinic-api';
import { isStrongPassword, passwordStrengthScore } from '@/lib/auth/password';

type LoadState =
  | { status: 'loading' }
  | { status: 'invalid'; code: string }
  | { status: 'ready'; invite: ClinicInvitationPreview }
  | { status: 'done'; invite: ClinicInvitationPreview };

function errorCode(err: unknown): string {
  return (err as { code?: string })?.code ?? 'UNKNOWN';
}

export default function InvitePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const score = useMemo(() => passwordStrengthScore(password), [password]);
  const labels = { showLabel: t('clinicAuth.show_password'), hideLabel: t('clinicAuth.hide_password') };

  useEffect(() => {
    let cancelled = false;
    clinicApi
      .peekInvitation(token)
      .then((invite) => !cancelled && setState({ status: 'ready', invite }))
      .catch((err) => !cancelled && setState({ status: 'invalid', code: errorCode(err) }));
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(e: FormEvent, invite: ClinicInvitationPreview) {
    e.preventDefault();
    setError('');
    const errs: typeof errors = {};
    if (invite.existingUser) {
      if (!password) errs.password = t('clinicAuth.errors.required');
    } else {
      if (!isStrongPassword(password)) errs.password = t('clinicAuth.errors.invalid_password');
      if (password !== confirm) errs.confirm = t('clinicAuth.errors.password_mismatch');
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await clinicApi.acceptInvitation(token, password);
      setState({ status: 'done', invite });
    } catch (err) {
      const code = errorCode(err);
      if (code === 'INVITATION_EXPIRED' || code === 'INVITATION_INVALID' || code === 'INVITATION_ALREADY_ACCEPTED') {
        setState({ status: 'invalid', code });
      } else {
        setError(t(`crm.invite.errors.${code}`, { defaultValue: t('crm.invite.errors.UNKNOWN') }));
      }
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <AuthLinkRow>
      <Link href="/login" className="font-semibold text-primary hover:underline">
        {t('crm.invite.go_login')}
      </Link>
    </AuthLinkRow>
  );

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (state.status === 'invalid') {
    return (
      <AuthShell footer={footer}>
        <AuthCard title={t('crm.invite.invalid_title')}>
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <MailWarning className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {t(`crm.invite.errors.${state.code}`, { defaultValue: t('crm.invite.errors.INVITATION_INVALID') })}
            </p>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  const { invite } = state;
  const name = `${invite.firstName} ${invite.lastName}`.trim();
  const login = invite.email || invite.phone || '';

  if (state.status === 'done') {
    return (
      <AuthShell>
        <AuthCard title={t('crm.invite.done_title')} subtitle={t('crm.invite.done_subtitle', { clinic: invite.clinicName })}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p>{t('crm.invite.done_login', { login })}</p>
            </div>
            <AuthButton type="button" onClick={() => router.replace('/login')}>
              {t('crm.invite.go_login')}
            </AuthButton>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell footer={footer}>
      <AuthCard
        title={t('crm.invite.title', { name })}
        subtitle={t(invite.existingUser ? 'crm.invite.subtitle_existing' : 'crm.invite.subtitle_new')}
      >
        <form onSubmit={(e) => void onSubmit(e, invite)} className="space-y-4" noValidate>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{invite.clinicName}</p>
              <p className="truncate text-xs text-slate-500">{login}</p>
            </div>
          </div>
          <div className="space-y-2">
            <PasswordField
              label={t(invite.existingUser ? 'crm.invite.current_password' : 'crm.invite.new_password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete={invite.existingUser ? 'current-password' : 'new-password'}
              {...labels}
            />
            {!invite.existingUser ? (
              <PasswordStrengthBar
                score={score}
                labels={{
                  weak: t('clinicAuth.password.weak'),
                  ok: t('clinicAuth.password.ok'),
                  strong: t('clinicAuth.password.strong'),
                }}
              />
            ) : null}
          </div>
          {!invite.existingUser ? (
            <PasswordField
              label={t('clinicAuth.account.password.confirm')}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errors.confirm}
              autoComplete="new-password"
              {...labels}
            />
          ) : null}
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <AuthButton type="submit" loading={loading}>
            {t('crm.invite.accept')}
          </AuthButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
