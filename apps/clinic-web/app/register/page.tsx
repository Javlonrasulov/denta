'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthCard, AuthShell } from '@/components/auth/AuthShell';
import {
  AuthButton,
  AuthField,
  AuthLinkRow,
  PasswordField,
  PasswordStrengthBar,
} from '@/components/auth/AuthFields';
import { mapAuthError, useAuth } from '@/components/providers/AuthProvider';
import { isStrongPassword, passwordStrengthScore } from '@/lib/auth/password';
import {
  formatUzPhoneDisplay,
  isValidEmail,
  isValidUzPhone,
  maskUzPhoneInput,
  normalizeEmail,
  normalizeUzPhone,
} from '@/lib/auth/phone';

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { registerClinic } = useAuth();

  const [clinicName, setClinicName] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const score = useMemo(() => passwordStrengthScore(password), [password]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!clinicName.trim()) next.clinicName = t('clinicAuth.errors.required');
    if (!adminFirstName.trim()) next.adminFirstName = t('clinicAuth.errors.required');
    if (!adminLastName.trim()) next.adminLastName = t('clinicAuth.errors.required');
    if (!isValidUzPhone(phone)) next.phone = t('clinicAuth.errors.invalid_phone');
    if (!isValidEmail(email)) next.email = t('clinicAuth.errors.invalid_email');
    if (!isStrongPassword(password)) next.password = t('clinicAuth.errors.invalid_password');
    if (password !== confirm) next.confirm = t('clinicAuth.errors.password_mismatch');
    if (!acceptTerms) next.terms = t('clinicAuth.errors.terms_required');
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await registerClinic({
        clinicName: clinicName.trim(),
        adminFirstName: adminFirstName.trim(),
        adminLastName: adminLastName.trim(),
        phone: normalizeUzPhone(phone)!,
        email: normalizeEmail(email),
        password,
        acceptTerms,
      });
      sessionStorage.setItem(
        'denta.verify.email',
        JSON.stringify({ email: result.email, cooldown: result.resendAvailableIn }),
      );
      router.push(`/verify-email?email=${encodeURIComponent(result.email)}`);
    } catch (err) {
      setFormError(mapAuthError(err, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      layout="scroll"
      className="max-w-[520px]"
      footer={
        <AuthLinkRow>
          {t('clinicAuth.register.have_account')}{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t('clinicAuth.register.sign_in')}
          </Link>
        </AuthLinkRow>
      }
    >
      <AuthCard
        title={t('clinicAuth.register.title')}
        subtitle={t('clinicAuth.register.subtitle')}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <AuthField
            label={t('clinicAuth.register.clinic_name')}
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            error={fieldErrors.clinicName}
            autoComplete="organization"
          />
          <div className="grid gap-4 tablet:grid-cols-2">
            <AuthField
              label={t('clinicAuth.register.first_name')}
              value={adminFirstName}
              onChange={(e) => setAdminFirstName(e.target.value)}
              error={fieldErrors.adminFirstName}
              autoComplete="given-name"
            />
            <AuthField
              label={t('clinicAuth.register.last_name')}
              value={adminLastName}
              onChange={(e) => setAdminLastName(e.target.value)}
              error={fieldErrors.adminLastName}
              autoComplete="family-name"
            />
          </div>
          <AuthField
            label={t('clinicAuth.register.phone')}
            value={phone}
            onChange={(e) => setPhone(maskUzPhoneInput(e.target.value))}
            error={fieldErrors.phone}
            inputMode="tel"
            autoComplete="tel"
            placeholder={formatUzPhoneDisplay('+998901234567')}
          />
          <AuthField
            label={t('clinicAuth.register.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
            placeholder="clinic@example.com"
          />
          <div className="space-y-2">
            <PasswordField
              label={t('clinicAuth.register.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              autoComplete="new-password"
              showLabel={t('clinicAuth.show_password')}
              hideLabel={t('clinicAuth.hide_password')}
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
            label={t('clinicAuth.register.confirm_password')}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={fieldErrors.confirm}
            autoComplete="new-password"
            showLabel={t('clinicAuth.show_password')}
            hideLabel={t('clinicAuth.hide_password')}
          />

          <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span>
              {t('clinicAuth.register.terms_prefix')}{' '}
              <span className="font-medium text-primary">{t('clinicAuth.register.terms')}</span>
              {' '}{t('clinicAuth.register.and')}{' '}
              <span className="font-medium text-primary">{t('clinicAuth.register.privacy')}</span>
            </span>
          </label>
          {fieldErrors.terms ? (
            <p className="text-xs font-medium text-red-600">{fieldErrors.terms}</p>
          ) : null}

          {formError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <AuthButton type="submit" loading={loading}>
            {t('clinicAuth.register.cta')}
          </AuthButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
