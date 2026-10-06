'use client';

import { KeyRound } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthButton, PasswordField, PasswordStrengthBar } from '@/components/auth/AuthFields';
import { AuthCard, AuthShell } from '@/components/auth/AuthShell';
import { mapAuthError, useAuth } from '@/components/providers/AuthProvider';
import { isStrongPassword, passwordStrengthScore } from '@/lib/auth/password';

/** Blocks the CRM until a staff member replaces the temporary password the clinic gave them. */
export function ForcePasswordChange() {
  const { t } = useTranslation();
  const { changePassword, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const score = useMemo(() => passwordStrengthScore(next), [next]);
  const labels = { showLabel: t('clinicAuth.show_password'), hideLabel: t('clinicAuth.hide_password') };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const errs: typeof errors = {};
    if (!current) errs.current = t('clinicAuth.errors.required');
    if (!isStrongPassword(next)) errs.next = t('clinicAuth.errors.invalid_password');
    if (next !== confirm) errs.confirm = t('clinicAuth.errors.password_mismatch');
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
    } catch (err) {
      setError(mapAuthError(err, t));
      setLoading(false);
    }
  }

  return (
    <AuthShell
      footer={
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm font-semibold text-slate-500 transition hover:text-primary"
        >
          {t('clinicAuth.force_password.logout')}
        </button>
      }
    >
      <AuthCard
        title={t('clinicAuth.force_password.title')}
        subtitle={t('clinicAuth.force_password.subtitle')}
      >
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{t('clinicAuth.force_password.hint')}</p>
          </div>
          <PasswordField
            label={t('clinicAuth.force_password.current')}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            error={errors.current}
            autoComplete="current-password"
            {...labels}
          />
          <div className="space-y-2">
            <PasswordField
              label={t('clinicAuth.account.password.new')}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              error={errors.next}
              autoComplete="new-password"
              {...labels}
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
            error={errors.confirm}
            autoComplete="new-password"
            {...labels}
          />
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <AuthButton type="submit" loading={loading}>
            {t('clinicAuth.force_password.save')}
          </AuthButton>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
