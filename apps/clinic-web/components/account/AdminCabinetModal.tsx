'use client';

import { CheckCircle2, KeyRound, Mail, Phone, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import {
  AuthButton,
  AuthField,
  PasswordField,
  PasswordStrengthBar,
} from '@/components/auth/AuthFields';
import { OtpInput } from '@/components/auth/OtpInput';
import { mapAuthError, useAuth } from '@/components/providers/AuthProvider';
import { isAuthMockMode } from '@/lib/auth';
import { isStrongPassword, passwordStrengthScore } from '@/lib/auth/password';
import {
  formatUzPhoneDisplay,
  isValidEmail,
  isValidUzPhone,
  maskUzPhoneInput,
  normalizeEmail,
  normalizeUzPhone,
} from '@/lib/auth/phone';
import { cn } from '@/lib/cn';

type Tab = 'phone' | 'password' | 'email';

const TABS: { id: Tab; icon: typeof Phone }[] = [
  { id: 'phone', icon: Phone },
  { id: 'password', icon: KeyRound },
  { id: 'email', icon: Mail },
];

export function AdminCabinetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('phone');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) setTab('phone');
  }, [open]);

  if (!open || !mounted || !user) return null;

  const initials =
    `${user.adminFirstName.charAt(0)}${user.adminLastName.charAt(0)}`.toUpperCase() || 'AD';
  const displayName = `${user.adminFirstName} ${user.adminLastName}`.trim();

  // Portal: the sticky header uses backdrop-blur, which would trap `position: fixed` children.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 font-sans backdrop-blur-sm tablet:items-center tablet:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-cabinet-title"
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl tablet:max-w-lg tablet:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="admin-cabinet-title" className="truncate text-base font-semibold text-slate-900">
              {t('clinicAuth.account.title')}
            </h2>
            <p className="truncate text-sm text-slate-500">
              {displayName}
              {user.clinicName ? ` · ${user.clinicName}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={t('clinicAuth.account.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3 tablet:grid-cols-2">
          <SummaryItem
            label={t('clinicAuth.account.login_label')}
            value={user.phone ? formatUzPhoneDisplay(user.phone) : '—'}
          />
          <SummaryItem
            label={t('clinicAuth.account.email_label')}
            value={user.email || '—'}
            badge={
              user.email ? (
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                    user.emailVerifiedAt
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700',
                  )}
                >
                  {user.emailVerifiedAt
                    ? t('clinicAuth.account.verified')
                    : t('clinicAuth.account.unverified')}
                </span>
              ) : null
            }
          />
        </div>

        <div className="px-5 pt-4">
          <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {TABS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition',
                  tab === id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <Icon className="h-4 w-4" />
                {t(`clinicAuth.account.tabs.${id}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
          <div className={tab === 'phone' ? '' : 'hidden'}>
            <PhoneForm />
          </div>
          <div className={tab === 'password' ? '' : 'hidden'}>
            <PasswordForm />
          </div>
          <div className={tab === 'email' ? '' : 'hidden'}>
            <EmailForm />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SummaryItem({ label, value, badge }: { label: string; value: string; badge?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-caption text-slate-500">{label}</p>
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="truncate text-sm font-medium text-slate-900">{value}</p>
        {badge}
      </div>
    </div>
  );
}

function SectionIntro({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-0.5 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function FormAlert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-xl border px-3 py-2 text-sm',
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700',
      )}
    >
      {tone === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : null}
      <span>{children}</span>
    </div>
  );
}

function usePasswordLabels() {
  const { t } = useTranslation();
  return {
    showLabel: t('clinicAuth.show_password'),
    hideLabel: t('clinicAuth.hide_password'),
  };
}

function PhoneForm() {
  const { t } = useTranslation();
  const { user, changePhone } = useAuth();
  const passwordLabels = usePasswordLabels();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; password?: string }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const normalized = normalizeUzPhone(phone);
    const next: typeof fieldErrors = {};
    if (!normalized || !isValidUzPhone(normalized)) {
      next.phone = t('clinicAuth.errors.invalid_phone');
    } else if (normalized === user?.phone) {
      next.phone = t('clinicAuth.account.phone.same');
    }
    if (!password) next.password = t('clinicAuth.errors.required');
    setFieldErrors(next);
    if (Object.keys(next).length > 0 || !normalized) return;

    setLoading(true);
    try {
      await changePhone({ phone: normalized, currentPassword: password });
      setPhone('');
      setPassword('');
      setSuccess(t('clinicAuth.account.phone.success'));
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <SectionIntro
        title={t('clinicAuth.account.phone.title')}
        hint={t('clinicAuth.account.phone.hint')}
      />
      <AuthField
        label={t('clinicAuth.account.phone.new')}
        value={phone}
        onChange={(e) => setPhone(maskUzPhoneInput(e.target.value))}
        error={fieldErrors.phone}
        inputMode="tel"
        autoComplete="tel"
        placeholder={formatUzPhoneDisplay('+998901234567')}
      />
      <PasswordField
        label={t('clinicAuth.account.current_password')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        autoComplete="current-password"
        {...passwordLabels}
      />
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}
      {success ? <FormAlert tone="success">{success}</FormAlert> : null}
      <AuthButton type="submit" loading={loading}>
        {t('clinicAuth.account.phone.save')}
      </AuthButton>
    </form>
  );
}

function PasswordForm() {
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const passwordLabels = usePasswordLabels();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    current?: string;
    next?: string;
    confirm?: string;
  }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const score = useMemo(() => passwordStrengthScore(next), [next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const errs: typeof fieldErrors = {};
    if (!current) errs.current = t('clinicAuth.errors.required');
    if (!isStrongPassword(next)) errs.next = t('clinicAuth.errors.invalid_password');
    if (next !== confirm) errs.confirm = t('clinicAuth.errors.password_mismatch');
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setCurrent('');
      setNext('');
      setConfirm('');
      setSuccess(t('clinicAuth.account.password.success'));
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <SectionIntro
        title={t('clinicAuth.account.password.title')}
        hint={t('clinicAuth.account.password.hint')}
      />
      <PasswordField
        label={t('clinicAuth.account.current_password')}
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        error={fieldErrors.current}
        autoComplete="current-password"
        {...passwordLabels}
      />
      <div className="space-y-2">
        <PasswordField
          label={t('clinicAuth.account.password.new')}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          error={fieldErrors.next}
          autoComplete="new-password"
          {...passwordLabels}
        />
        <PasswordStrengthBar
          score={score}
          labels={{
            weak: t('clinicAuth.password.weak'),
            ok: t('clinicAuth.password.ok'),
            strong: t('clinicAuth.password.strong'),
          }}
        />
      </div>
      <PasswordField
        label={t('clinicAuth.account.password.confirm')}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={fieldErrors.confirm}
        autoComplete="new-password"
        {...passwordLabels}
      />
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}
      {success ? <FormAlert tone="success">{success}</FormAlert> : null}
      <AuthButton type="submit" loading={loading}>
        {t('clinicAuth.account.password.save')}
      </AuthButton>
    </form>
  );
}

function EmailForm() {
  const { t } = useTranslation();
  const { user, requestEmailChange, confirmEmailChange, service } = useAuth();
  const passwordLabels = usePasswordLabels();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (step !== 'verify' || !isAuthMockMode() || !pendingEmail) return;
    setDevHint(service.getDevLastOtp?.(pendingEmail) ?? null);
  }, [step, pendingEmail, service, cooldown]);

  async function sendCode(target: string) {
    const r = await requestEmailChange({ newEmail: target, currentPassword: password });
    setPendingEmail(r.email);
    setCooldown(r.resendAvailableIn);
    setCode('');
    setStep('verify');
  }

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const normalized = normalizeEmail(email);
    const errs: typeof fieldErrors = {};
    if (!isValidEmail(normalized)) {
      errs.email = t('clinicAuth.errors.invalid_email');
    } else if (user?.email && normalizeEmail(user.email) === normalized) {
      errs.email = t('clinicAuth.errors.same_email');
    }
    if (!password) errs.password = t('clinicAuth.errors.required');
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await sendCode(normalized);
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (cooldown > 0 || !pendingEmail) return;
    setError('');
    try {
      await sendCode(pendingEmail);
    } catch (err) {
      setError(mapAuthError(err, t));
    }
  }

  async function onConfirm(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (code.length !== 6) {
      setError(t('clinicAuth.errors.invalid_code'));
      return;
    }
    setLoading(true);
    try {
      await confirmEmailChange({ newEmail: pendingEmail, code });
      setStep('request');
      setEmail('');
      setPassword('');
      setPendingEmail('');
      setCode('');
      setCooldown(0);
      setSuccess(t('clinicAuth.account.email.success'));
    } catch (err) {
      setError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  function backToRequest() {
    setStep('request');
    setCode('');
    setError('');
  }

  const mm = String(Math.floor(cooldown / 60)).padStart(2, '0');
  const ss = String(cooldown % 60).padStart(2, '0');

  if (step === 'verify') {
    return (
      <form onSubmit={onConfirm} className="space-y-4" noValidate>
        <SectionIntro
          title={t('clinicAuth.account.email.title')}
          hint={t('clinicAuth.account.email.code_sent', { email: pendingEmail })}
        />
        <OtpInput value={code} onChange={setCode} error={Boolean(error)} disabled={loading} />
        {devHint ? (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-center text-xs text-slate-500">
            {t('clinicAuth.verify.dev_hint', { code: devHint })}
          </p>
        ) : null}
        {error ? <FormAlert tone="error">{error}</FormAlert> : null}
        <AuthButton type="submit" loading={loading}>
          {t('clinicAuth.account.email.confirm')}
        </AuthButton>
        <div className="grid grid-cols-1 gap-2 tablet:grid-cols-2">
          <AuthButton
            variant="secondary"
            disabled={cooldown > 0 || loading}
            onClick={() => void onResend()}
          >
            {cooldown > 0
              ? t('clinicAuth.account.email.resend_in', { time: `${mm}:${ss}` })
              : t('clinicAuth.account.email.resend')}
          </AuthButton>
          <AuthButton variant="ghost" disabled={loading} onClick={backToRequest}>
            {t('clinicAuth.account.email.change_address')}
          </AuthButton>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onRequest} className="space-y-4" noValidate>
      <SectionIntro
        title={t('clinicAuth.account.email.title')}
        hint={t('clinicAuth.account.email.hint')}
      />
      <AuthField
        label={t('clinicAuth.account.email.new')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        autoComplete="email"
        placeholder="name@clinic.uz"
      />
      <PasswordField
        label={t('clinicAuth.account.current_password')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        autoComplete="current-password"
        {...passwordLabels}
      />
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}
      {success ? <FormAlert tone="success">{success}</FormAlert> : null}
      <AuthButton type="submit" loading={loading}>
        {t('clinicAuth.account.email.send_code')}
      </AuthButton>
    </form>
  );
}
