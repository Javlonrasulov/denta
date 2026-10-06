'use client';

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Info,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  LogIn,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  UserPlus,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthButton, AuthField } from '@/components/auth/AuthFields';
import { AgreementForm } from '@/components/doctor-finance/AgreementForm';
import {
  DoctorLookupCard,
  SelectedDoctorBanner,
  type LookupSource,
} from '@/components/doctors/DoctorLookupCard';
import { ScheduleEditor } from '@/components/doctors/ScheduleEditor';
import { SpecialtyPicker } from '@/components/doctors/SpecialtyPicker';
import { CopyRow } from '@/components/users/AddStaffModal';
import {
  FormError,
  ModalBody,
  ModalFooter,
  ModalIcon,
  ModalSection,
  ModalShell,
} from '@/components/users/ModalShell';
import { clinicApi, type DoctorLookupMatch } from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import {
  formatUzPhoneDisplay,
  maskUzPhoneInput,
  normalizeUzPhone,
} from '@/lib/auth/phone';
import { cn } from '@/lib/cn';
import {
  agreementBodyFromForm,
  emptyAgreementForm,
  financeErrorText,
  formFieldFromApi,
  todayLocalYmd,
  useDoctorFinanceAccess,
  validateAgreementForm,
  type AgreementErrors,
  type AgreementForm as AgreementFormState,
} from '@/lib/doctor-finance';
import {
  DEFAULT_SLOT,
  defaultWeek,
  scheduleFromWeek,
  validateWeek,
  type WeekState,
} from '@/lib/doctor-schedule';

/** Must match DEFAULT_DOCTOR_PASSWORD in the API (members.service.ts). */
export const DEFAULT_DOCTOR_PASSWORD = '123456';

type FormState = {
  firstName: string;
  lastName: string;
  specialties: string[];
  experienceYears: string;
  phone: string;
};

type FieldErrors = Partial<
  Record<'firstName' | 'lastName' | 'specialties' | 'experienceYears' | 'phone', string>
>;

type FinanceOutcome = 'saved' | 'skipped' | 'failed' | 'not_allowed';

type Result = (
  | { kind: 'created'; login: string; password: string; name: string }
  | { kind: 'attached'; login: string; name: string }
) & { doctorId: string | null; finance: FinanceOutcome; financeError?: string };

type Selected = { match: DoctorLookupMatch; source: LookupSource };

function emptyForm(): FormState {
  return {
    firstName: '',
    lastName: '',
    specialties: [],
    experienceYears: '',
    phone: '+998',
  };
}

function initialsOf(firstName: string, lastName: string): string {
  return `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
}

function splitSpecialties(value: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function useDebouncedLookup<T>(
  key: string | null,
  query: () => Promise<T>,
  delay: number,
): { key: string; data: T } | null {
  const [state, setState] = useState<{ key: string; data: T } | null>(null);
  useEffect(() => {
    if (!key) {
      setState(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      query()
        .then((data) => !cancelled && setState({ key, data }))
        .catch(() => !cancelled && setState(null));
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, delay]);
  return state?.key === key ? state : null;
}

function lookup(body: { phone?: string; firstName?: string; lastName?: string }) {
  const token = readPersistedSession()?.accessToken;
  return token ? clinicApi.lookupDoctor(token, body) : Promise.resolve([]);
}

export function AddDoctorModal({
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
  const [week, setWeek] = useState<WeekState>(defaultWeek);
  const [slotDuration, setSlotDuration] = useState(DEFAULT_SLOT);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const finance = useDoctorFinanceAccess();
  const [step, setStep] = useState<1 | 2>(1);
  const [today, setToday] = useState(todayLocalYmd);
  const [agreement, setAgreement] = useState<AgreementFormState>(() => emptyAgreementForm());
  const [agreementErrors, setAgreementErrors] = useState<AgreementErrors>({});

  const reset = () => {
    setForm(emptyForm());
    setWeek(defaultWeek());
    setSlotDuration(DEFAULT_SLOT);
    setSelected(null);
    setDismissed([]);
    setFieldErrors({});
    setError('');
    setResult(null);
    setStep(1);
    const now = todayLocalYmd();
    setToday(now);
    setAgreement(emptyAgreementForm(now));
    setAgreementErrors({});
  };

  const patchAgreement = (patch: Partial<AgreementFormState>) => {
    setAgreement((a) => ({ ...a, ...patch }));
    setAgreementErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch)) delete next[key as keyof AgreementErrors];
      if ('priorCoveredFrom' in patch || 'priorCoveredTo' in patch) delete next.priorCovered;
      if ('amount' in patch || 'recurrence' in patch) delete next.amount;
      if ('scheduleItems' in patch) delete next.scheduleItems;
      return next;
    });
  };

  useEffect(() => {
    if (open) reset();
  }, [open]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const phone = normalizeUzPhone(form.phone);
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();

  const phoneKey = open && !selected && phone ? phone : null;
  const phoneLookup = useDebouncedLookup(phoneKey, () => lookup({ phone: phone! }), 300);
  const phoneMatch = phoneLookup?.data[0] ?? null;
  const phoneChecking = Boolean(phoneKey && !phoneLookup);

  const nameKey =
    open && !selected && !phoneMatch && firstName.length >= 2 && lastName.length >= 2
      ? `${firstName.toLowerCase()}|${lastName.toLowerCase()}`
      : null;
  const nameLookup = useDebouncedLookup(nameKey, () => lookup({ firstName, lastName }), 500);
  const nameMatches = (nameLookup?.data ?? []).filter(
    (m) => m.isDoctor && !dismissed.includes(m.userId),
  );

  const busy = useMemo(
    () =>
      (selected?.match.clinics ?? [])
        .filter((c) => c.current && !c.isThisClinic && c.schedule.length)
        .map((c) => ({ clinicName: c.clinicName, schedule: c.schedule })),
    [selected],
  );

  const pickMatch = (match: DoctorLookupMatch, source: LookupSource) => {
    setSelected({ match, source });
    setForm((f) => ({
      ...f,
      firstName: match.firstName,
      lastName: match.lastName,
      specialties: splitSpecialties(match.specialty).length
        ? splitSpecialties(match.specialty)
        : f.specialties,
      experienceYears: match.experienceYears ? String(match.experienceYears) : f.experienceYears,
    }));
    setFieldErrors({});
    setError('');
  };

  const fullName = `${firstName} ${lastName}`.trim();
  const years = Number.parseInt(form.experienceYears, 10);
  const byName = selected?.source === 'name';

  const workingDays = useMemo(() => scheduleFromWeek(week).map((d) => d.dayOfWeek), [week]);

  function validateDetails(): boolean {
    if (phoneMatch && !selected) {
      setError(t(phoneMatch.alreadyHere ? 'crm.doctors.lookup.already_here' : 'crm.doctors.lookup.answer_first'));
      return false;
    }

    const errs: FieldErrors = {};
    if (!firstName) errs.firstName = t('crm.doctors.modal.required');
    if (!lastName) errs.lastName = t('crm.doctors.modal.required');
    if (!form.specialties.length) errs.specialties = t('crm.doctors.specialty.required');
    if (form.experienceYears && (!Number.isFinite(years) || years < 0 || years > 60)) {
      errs.experienceYears = t('crm.doctors.modal.invalid_experience');
    }
    if (!byName && !phone) errs.phone = t('crm.doctors.modal.invalid_phone');
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return false;

    if (!scheduleFromWeek(week).length) {
      setError(t('crm.doctors.schedule.errors.empty'));
      return false;
    }
    if (Object.keys(validateWeek(week)).length) {
      setError(t('crm.doctors.schedule.errors.fix'));
      return false;
    }
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (step === 1) {
      if (!validateDetails()) return;
      if (finance.agreement) {
        setStep(2);
        return;
      }
      await create(false);
      return;
    }
    await create(true);
  }

  async function create(withAgreement: boolean) {
    let agreementBody;
    if (withAgreement) {
      const errs = validateAgreementForm(agreement, today);
      setAgreementErrors(errs);
      if (Object.keys(errs).length) {
        setError(t('crm.doctor_finance.errors.fix_form'));
        return;
      }
      agreementBody = agreementBodyFromForm(agreement);
    }

    const token = readPersistedSession()?.accessToken;
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const body = await clinicApi.createDoctor(token, {
        firstName,
        lastName,
        ...(byName ? { existingUserId: selected!.match.userId } : { phone: phone! }),
        specialties: form.specialties,
        experienceYears: Number.isFinite(years) ? years : undefined,
        schedule: scheduleFromWeek(week),
        slotDuration,
        ...(agreementBody ? { agreement: agreementBody } : {}),
      });
      const financeOutcome: FinanceOutcome = !finance.agreement
        ? 'not_allowed'
        : !agreementBody
          ? 'skipped'
          : body.agreementSaved
            ? 'saved'
            : 'failed';
      const base = {
        doctorId: body.doctorId ?? null,
        finance: financeOutcome,
        financeError: body.agreementError ? financeErrorText((k) => t(k), body.agreementError) : undefined,
      };
      setResult(
        body.kind === 'created'
          ? { kind: 'created', login: body.login, password: body.temporaryPassword, name: fullName, ...base }
          : { kind: 'attached', login: body.login, name: fullName, ...base },
      );
      onCreated();
    } catch (err) {
      const { code, details } = err as { code?: string; details?: { field?: string } };
      if (code === 'VALIDATION_ERROR' && withAgreement) {
        const field = formFieldFromApi(details?.field);
        if (field) setAgreementErrors((prev) => ({ ...prev, [field]: 'server' }));
        setError(field ? t('crm.doctor_finance.errors.fix_form') : financeErrorText((k) => t(k), err));
        return;
      }
      const key =
        code === 'ALREADY_MEMBER'
          ? 'crm.doctors.modal.errors.already_member'
          : code === 'INVALID_PHONE'
            ? 'crm.doctors.modal.invalid_phone'
            : code === 'INVALID_SCHEDULE'
              ? 'crm.doctors.schedule.errors.fix'
              : null;
      if (key) setStep(1);
      setError(key ? t(key) : err instanceof Error ? err.message : t('crm.doctors.modal.errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      closeLabel={t('crm.doctors.modal.close')}
      icon={
        <ModalIcon>
          <Stethoscope className="h-5 w-5" strokeWidth={2} />
        </ModalIcon>
      }
      title={t('crm.doctors.modal.title')}
      subtitle={t('crm.doctors.modal.subtitle')}
    >
      {result ? (
        <ResultView result={result} onAddAnother={reset} onClose={onClose} />
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          {finance.agreement ? (
            <StepIndicator
              step={step}
              labels={[t('crm.doctor_finance.wizard.step_details'), t('crm.doctor_finance.wizard.step_finance')]}
            />
          ) : null}
          {step === 2 ? (
            <ModalBody>
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary ring-1 ring-slate-200">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {t('crm.doctor_finance.wizard.title', { name: fullName })}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    {t('crm.doctor_finance.wizard.hint')}
                  </p>
                </div>
              </div>
              <AgreementForm
                form={agreement}
                onChange={patchAgreement}
                errors={agreementErrors}
                today={today}
                workingDays={workingDays}
              />
              {error ? <FormError>{error}</FormError> : null}
            </ModalBody>
          ) : (
          <ModalBody>
            <PreviewCard
              name={fullName}
              initials={initialsOf(form.firstName, form.lastName)}
              specialty={form.specialties.join(', ')}
              years={Number.isFinite(years) ? years : null}
              showBadge={!selected}
            />

            {selected ? (
              <SelectedDoctorBanner match={selected.match} onCancel={() => setSelected(null)} />
            ) : null}

            <ModalSection title={t('crm.doctors.modal.section_access')}>
              {byName ? (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-slate-700">{t('crm.doctors.modal.phone')}</p>
                  <div className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 text-sm text-slate-600">
                    <Lock className="h-4 w-4 text-slate-400" />
                    <span className="font-medium tabular-nums">{selected!.match.phoneMasked}</span>
                  </div>
                  <p className="text-xs text-slate-400">{t('crm.doctors.lookup.phone_locked')}</p>
                </div>
              ) : (
                <AuthField
                  label={t('crm.doctors.modal.phone')}
                  value={form.phone}
                  onChange={(e) => {
                    set('phone', maskUzPhoneInput(e.target.value));
                    if (selected) setSelected(null);
                  }}
                  error={fieldErrors.phone}
                  hint={phoneChecking ? undefined : t('crm.doctors.lookup.phone_first_hint')}
                  inputMode="tel"
                  autoComplete="off"
                  autoFocus
                  placeholder={formatUzPhoneDisplay('+998901234567')}
                />
              )}

              {phoneChecking ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t('crm.doctors.lookup.searching')}
                </p>
              ) : null}

              {phoneMatch && !selected ? (
                <div className="mt-3">
                  <DoctorLookupCard
                    match={phoneMatch}
                    source="phone"
                    onUse={() => pickMatch(phoneMatch, 'phone')}
                    onReject={() => set('phone', '+998')}
                  />
                </div>
              ) : null}

              {selected ? (
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-sky-200/80 bg-sky-50/70 p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sky-600 ring-1 ring-sky-200">
                    <Info className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <p className="min-w-0 text-sm leading-relaxed text-slate-700">
                    {t('crm.doctors.lookup.existing_login')}
                  </p>
                </div>
              ) : phoneMatch ? null : (
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 ring-1 ring-amber-200">
                    <KeyRound className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {t('crm.doctors.modal.default_password')}:{' '}
                      <span className="font-mono tracking-[0.2em]">{DEFAULT_DOCTOR_PASSWORD}</span>
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                      {t('crm.doctors.modal.default_password_hint')}
                    </p>
                  </div>
                </div>
              )}
            </ModalSection>

            <ModalSection title={t('crm.doctors.modal.section_personal')}>
              <div className="grid gap-3 tablet:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px]">
                <AuthField
                  label={t('crm.doctors.modal.first_name')}
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  error={fieldErrors.firstName}
                  autoComplete="off"
                />
                <AuthField
                  label={t('crm.doctors.modal.last_name')}
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  error={fieldErrors.lastName}
                  autoComplete="off"
                />
                <AuthField
                  label={t('crm.doctors.modal.experience_years')}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={60}
                  value={form.experienceYears}
                  onChange={(e) => set('experienceYears', e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                  error={fieldErrors.experienceYears}
                  placeholder="0"
                />
              </div>

              {nameMatches.length ? (
                <div className="mt-3 space-y-3">
                  {nameMatches.map((m) => (
                    <DoctorLookupCard
                      key={m.userId}
                      match={m}
                      source="name"
                      onUse={() => pickMatch(m, 'name')}
                      onReject={() => setDismissed((prev) => [...prev, m.userId])}
                    />
                  ))}
                </div>
              ) : null}
            </ModalSection>

            <SpecialtyPicker
              value={form.specialties}
              onChange={(next) => set('specialties', next)}
              error={fieldErrors.specialties}
            />

            <ScheduleEditor
              week={week}
              onWeekChange={setWeek}
              slotDuration={slotDuration}
              onSlotChange={setSlotDuration}
              busy={busy}
            />

            {error ? <FormError>{error}</FormError> : null}
          </ModalBody>
          )}

          {step === 2 ? (
            <ModalFooter>
              <AuthButton
                variant="secondary"
                onClick={() => {
                  setError('');
                  setStep(1);
                }}
                className="tablet:mr-auto tablet:w-auto tablet:px-4"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('crm.doctor_finance.wizard.back')}
              </AuthButton>
              <AuthButton
                variant="ghost"
                disabled={loading}
                onClick={() => void create(false)}
                className="tablet:w-auto tablet:px-4"
              >
                {t('crm.doctor_finance.wizard.later')}
              </AuthButton>
              <AuthButton type="submit" loading={loading} className="tablet:w-auto tablet:px-6">
                {!loading ? <UserPlus className="h-4 w-4" /> : null}
                {t('crm.doctors.modal.submit')}
              </AuthButton>
            </ModalFooter>
          ) : (
            <ModalFooter>
              <AuthButton variant="secondary" onClick={onClose} className="tablet:w-auto tablet:px-5">
                {t('crm.doctors.modal.cancel')}
              </AuthButton>
              <AuthButton
                type="submit"
                loading={loading}
                disabled={Boolean(phoneMatch?.alreadyHere && !selected)}
                className="tablet:w-auto tablet:px-6"
              >
                {finance.agreement ? (
                  <>
                    {t('crm.doctor_finance.wizard.next')}
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    {!loading ? <UserPlus className="h-4 w-4" /> : null}
                    {t('crm.doctors.modal.submit')}
                  </>
                )}
              </AuthButton>
            </ModalFooter>
          )}
        </form>
      )}
    </ModalShell>
  );
}

function StepIndicator({ step, labels }: { step: 1 | 2; labels: [string, string] }) {
  return (
    <ol className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-2.5">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2;
        const done = step > n;
        const active = step === n;
        return (
          <li key={label} className="flex min-w-0 items-center gap-2">
            {i > 0 ? <span className="h-px w-6 bg-slate-200" /> : null}
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                active
                  ? 'bg-primary text-white'
                  : done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-slate-400 ring-1 ring-slate-200',
              )}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
            </span>
            <span
              className={cn(
                'truncate text-xs font-semibold',
                active ? 'text-slate-900' : 'text-slate-400',
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function FinanceOutcomeNote({ result, onNavigate }: { result: Result; onNavigate: () => void }) {
  const { t } = useTranslation();
  if (result.finance === 'not_allowed') return null;
  const ok = result.finance === 'saved';
  const href = result.doctorId ? `/doctors/${encodeURIComponent(result.doctorId)}?tab=finance` : null;
  return (
    <div
      className={cn(
        'mt-4 flex items-start gap-3 rounded-xl p-3.5 ring-1',
        ok ? 'bg-emerald-50/70 ring-emerald-200' : 'bg-amber-50/70 ring-amber-200',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white ring-1',
          ok ? 'text-emerald-600 ring-emerald-200' : 'text-amber-600 ring-amber-200',
        )}
      >
        {ok ? <Wallet className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">
          {t(`crm.doctor_finance.wizard.outcome.${result.finance}`)}
        </p>
        {result.finance === 'failed' && result.financeError ? (
          <p className="mt-0.5 text-xs text-slate-600">{result.financeError}</p>
        ) : null}
        {href ? (
          <Link
            href={href}
            onClick={onNavigate}
            className="mt-1.5 inline-flex text-xs font-semibold text-primary hover:underline"
          >
            {t(ok ? 'crm.doctor_finance.wizard.open_finance' : 'crm.doctor_finance.wizard.configure_now')}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function PreviewCard({
  name,
  initials,
  specialty,
  years,
  showBadge = true,
}: {
  name: string;
  initials: string;
  specialty: string;
  years: number | null;
  showBadge?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary-muted via-white to-white p-4">
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-primary">
        <Smartphone className="h-3.5 w-3.5" strokeWidth={2.2} />
        {t('crm.doctors.modal.preview_label')}
      </p>
      <div className="relative mt-3 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-base font-semibold text-white shadow-lg shadow-primary/25">
          {initials || <Stethoscope className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm font-semibold', name ? 'text-slate-900' : 'text-slate-400')}>
            {name || t('crm.doctors.modal.preview_name')}
          </p>
          <p className="truncate text-xs text-slate-500">
            {[
              specialty || t('crm.doctors.modal.preview_specialty'),
              years !== null ? t('crm.doctors.years_short', { count: years }) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {showBadge ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
            {t('crm.doctors.modal.preview_badge')}
          </span>
        ) : null}
      </div>
    </div>
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
  const created = result.kind === 'created';
  const Icon = created ? CheckCircle2 : Link2;

  const steps = [
    { icon: Download, text: t('crm.doctors.modal.step_download') },
    { icon: LogIn, text: t('crm.doctors.modal.step_login') },
    { icon: ShieldCheck, text: t('crm.doctors.modal.step_change') },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Icon className="h-7 w-7" strokeWidth={2} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            {created
              ? t('crm.doctors.modal.done_created_title')
              : t('crm.doctors.modal.done_attached_title')}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {created
              ? t('crm.doctors.modal.done_created_hint', { name: result.name })
              : t('crm.doctors.modal.done_attached_hint', { name: result.name })}
          </p>
        </div>

        <div className="mt-6 space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <CopyRow label={t('crm.doctors.modal.login')} value={formatUzPhoneDisplay(result.login)} />
          {created ? (
            <CopyRow label={t('crm.doctors.modal.password')} value={result.password} mono />
          ) : null}
        </div>

        <FinanceOutcomeNote result={result} onNavigate={onClose} />

        {created ? (
          <div className="mt-5">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.04em] text-slate-400">
              {t('crm.doctors.modal.steps_title')}
            </p>
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-slate-200">
                    <step.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">{step.text}</span>
                  <span className="text-xs font-semibold text-slate-300">{i + 1}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>

      <ModalFooter>
        <AuthButton variant="secondary" onClick={onAddAnother} className="tablet:w-auto tablet:px-5">
          <UserPlus className="h-4 w-4" />
          {t('crm.doctors.modal.add_another')}
        </AuthButton>
        <AuthButton onClick={onClose} className="tablet:w-auto tablet:px-6">
          {t('crm.doctors.modal.close')}
        </AuthButton>
      </ModalFooter>
    </div>
  );
}
