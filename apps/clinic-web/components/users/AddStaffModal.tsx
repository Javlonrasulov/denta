'use client';

import { Check, CheckCircle2, Copy, Info, Link2, MailCheck, UserPlus } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthButton, AuthField } from '@/components/auth/AuthFields';
import {
  FormError,
  ModalBody,
  ModalFooter,
  ModalIcon,
  ModalSection,
  ModalShell,
} from '@/components/users/ModalShell';
import { PageAccessPicker } from '@/components/users/StaffPickers';
import { clinicApi } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import {
  formatUzPhoneDisplay,
  isValidEmail,
  maskUzPhoneInput,
  normalizeEmail,
  normalizeUzPhone,
} from '@/lib/auth/phone';
import { cn } from '@/lib/cn';
import { emptyAccess, memberErrorKey, permissionOverrides, type AccessMap } from '@/lib/staff';

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  access: AccessMap;
};

type FieldErrors = Partial<
  Record<'firstName' | 'lastName' | 'phone' | 'email' | 'access', string>
>;

type Result =
  | { kind: 'created'; login: string; password: string }
  | { kind: 'invitation'; email: string; devToken?: string }
  | { kind: 'attached'; name: string };

function emptyForm(): FormState {
  return {
    firstName: '',
    lastName: '',
    phone: '+998',
    email: '',
    access: emptyAccess(),
  };
}

export function AddStaffModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm());
    setFieldErrors({});
    setError('');
    setResult(null);
  }, [open]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const hasEmail = form.email.trim().length > 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const phone = normalizeUzPhone(form.phone);
    const email = hasEmail ? normalizeEmail(form.email) : '';
    const errs: FieldErrors = {};
    if (!form.firstName.trim()) errs.firstName = t('crm.users.modal.required');
    if (!form.lastName.trim()) errs.lastName = t('crm.users.modal.required');
    if (!phone) errs.phone = t('crm.users.modal.invalid_phone');
    if (hasEmail && !isValidEmail(email)) errs.email = t('crm.users.modal.invalid_email');
    if (Object.values(form.access).every((level) => level === 'none')) {
      errs.access = t('crm.users.access.required');
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0 || !phone) return;

    const token = readPersistedSession()?.accessToken;
    if (!token) return;

    setLoading(true);
    try {
      const body = await clinicApi.createMember(token, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone,
        email: email || undefined,
        role: 'RECEPTIONIST',
        permissions: permissionOverrides(form.access),
      });

      if (body.kind === 'created') {
        setResult({ kind: 'created', login: phone, password: body.temporaryPassword });
      } else if (body.kind === 'invitation') {
        setResult({ kind: 'invitation', email, devToken: body.activationToken });
      } else {
        setResult({ kind: 'attached', name: body.displayName });
      }
      onCreated();
    } catch (err) {
      const key = memberErrorKey(err);
      if (key === 'crm.users.errors.ALREADY_MEMBER') {
        setFieldErrors((prev) => ({ ...prev, phone: t(key) }));
      } else {
        setError(key ? t(key) : err instanceof Error ? err.message : 'Error');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      closeLabel={t('crm.users.modal.close')}
      icon={
        <ModalIcon>
          <UserPlus className="h-5 w-5" strokeWidth={2} />
        </ModalIcon>
      }
      title={t('crm.users.modal.title')}
      subtitle={t('crm.users.modal.subtitle')}
    >
      {result ? (
        <ResultView
          result={result}
          onAddAnother={() => {
            setForm(emptyForm());
            setResult(null);
          }}
          onClose={onClose}
        />
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <ModalBody>
            <ModalSection title={t('crm.users.modal.section_personal')}>
              <div className="grid gap-3 tablet:grid-cols-2">
                <AuthField
                  label={t('crm.users.modal.first_name')}
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  error={fieldErrors.firstName}
                  autoComplete="off"
                  autoFocus
                />
                <AuthField
                  label={t('crm.users.modal.last_name')}
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  error={fieldErrors.lastName}
                  autoComplete="off"
                />
              </div>
            </ModalSection>

            <ModalSection title={t('crm.users.modal.section_contact')}>
              <div className="grid gap-3 tablet:grid-cols-2">
                <AuthField
                  label={t('crm.users.modal.phone')}
                  value={form.phone}
                  onChange={(e) => set('phone', maskUzPhoneInput(e.target.value))}
                  error={fieldErrors.phone}
                  inputMode="tel"
                  autoComplete="off"
                  placeholder={formatUzPhoneDisplay('+998901234567')}
                />
                <AuthField
                  label={`${t('crm.users.modal.email')} (${t('crm.users.modal.optional')})`}
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  error={fieldErrors.email}
                  autoComplete="off"
                  placeholder="name@clinic.uz"
                />
              </div>
            </ModalSection>

            <ModalSection title={t('crm.users.access.title')}>
              <PageAccessPicker
                value={form.access}
                onChange={(access) => {
                  set('access', access);
                  setFieldErrors((prev) => ({ ...prev, access: undefined }));
                }}
                error={fieldErrors.access}
              />
            </ModalSection>

            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
              {hasEmail ? (
                <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              )}
              <span>
                {hasEmail ? t('crm.users.modal.hint_invite') : t('crm.users.modal.hint_temp')}
              </span>
            </div>

            {error ? <FormError>{error}</FormError> : null}
          </ModalBody>

          <ModalFooter>
            <AuthButton variant="secondary" onClick={onClose} className="tablet:w-auto tablet:px-5">
              {t('crm.users.cancel')}
            </AuthButton>
            <AuthButton type="submit" loading={loading} className="tablet:w-auto tablet:px-6">
              {!loading ? <UserPlus className="h-4 w-4" /> : null}
              {t('crm.users.modal.submit')}
            </AuthButton>
          </ModalFooter>
        </form>
      )}
    </ModalShell>
  );
}

function ResultView({
  result,
  onAddAnother,
  onClose,
}: {
  result: Result;
  onAddAnother: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  const title =
    result.kind === 'created'
      ? t('crm.users.modal.done_created_title')
      : result.kind === 'invitation'
        ? t('crm.users.modal.done_invite_title')
        : t('crm.users.modal.done_attached_title');

  const hint =
    result.kind === 'created'
      ? t('crm.users.modal.done_created_hint')
      : result.kind === 'invitation'
        ? t('crm.users.modal.done_invite_hint', { email: result.email })
        : t('crm.users.modal.done_attached_hint', { name: result.name });

  const Icon =
    result.kind === 'invitation' ? MailCheck : result.kind === 'attached' ? Link2 : CheckCircle2;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Icon className="h-7 w-7" strokeWidth={2} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>
        </div>

        {result.kind === 'created' ? (
          <div className="mt-6 space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
            <CopyRow label={t('crm.users.modal.login')} value={formatUzPhoneDisplay(result.login)} />
            <CopyRow label={t('crm.users.modal.temp_password')} value={result.password} mono />
          </div>
        ) : null}

        {result.kind === 'invitation' && result.devToken ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <CopyRow
              label={t('crm.users.modal.dev_token')}
              value={`${window.location.origin}/invite/${result.devToken}`}
              mono
            />
          </div>
        ) : null}
      </div>

      <ModalFooter>
        <AuthButton variant="secondary" onClick={onAddAnother} className="tablet:w-auto tablet:px-5">
          <UserPlus className="h-4 w-4" />
          {t('crm.users.modal.add_another')}
        </AuthButton>
        <AuthButton onClick={onClose} className="tablet:w-auto tablet:px-6">
          {t('crm.users.modal.close')}
        </AuthButton>
      </ModalFooter>
    </div>
  );
}

export function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 ring-1 ring-slate-200/70">
      <div className="min-w-0 flex-1">
        <p className="text-caption text-slate-500">{label}</p>
        <p
          className={cn(
            'truncate text-sm font-semibold text-slate-900',
            mono && 'font-mono tracking-wide',
          )}
        >
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        className={cn(
          'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition',
          copied
            ? 'bg-emerald-50 text-emerald-700'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? t('crm.users.modal.copied') : t('crm.users.modal.copy')}
      </button>
    </div>
  );
}
