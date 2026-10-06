'use client';

import { CheckCircle2, KeyRound, Lock, Pencil, RotateCcw, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthButton, AuthField } from '@/components/auth/AuthFields';
import { DEFAULT_DOCTOR_PASSWORD, PreviewCard } from '@/components/doctors/AddDoctorModal';
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
import {
  clinicApi,
  type ClinicDoctorRow,
  type UpdateClinicDoctorBody,
} from '@/lib/api/clinic-api';
import { formatUzPhoneDisplay } from '@/lib/auth/phone';
import { readPersistedSession } from '@/lib/auth/session';
import {
  DEFAULT_SLOT,
  scheduleFromWeek,
  validateWeek,
  weekFromSchedule,
  type WeekState,
} from '@/lib/doctor-schedule';

type FormState = {
  firstName: string;
  lastName: string;
  specialties: string[];
  experienceYears: string;
  priceFrom: string;
};

type FieldErrors = Partial<Record<'firstName' | 'lastName' | 'specialties' | 'experienceYears', string>>;

function splitSpecialties(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function formFromDoctor(d: ClinicDoctorRow): FormState {
  return {
    firstName: d.firstName,
    lastName: d.lastName,
    specialties: splitSpecialties(d.specialization),
    experienceYears: String(d.experienceYears || ''),
    priceFrom: d.priceFrom ? String(d.priceFrom) : '',
  };
}

function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function EditDoctorModal({
  doctor,
  onClose,
  onSaved,
}: {
  doctor: ClinicDoctorRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState | null>(null);
  const [week, setWeek] = useState<WeekState | null>(null);
  const [slotDuration, setSlotDuration] = useState(DEFAULT_SLOT);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doctor) return;
    setForm(formFromDoctor(doctor));
    setWeek(weekFromSchedule(doctor.schedule ?? []));
    setSlotDuration(doctor.slotDuration || DEFAULT_SLOT);
    setFieldErrors({});
    setError('');
  }, [doctor]);

  if (!doctor || !form || !week) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const years = Number.parseInt(form.experienceYears, 10);
  const price = Number.parseInt(form.priceFrom, 10);
  const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!doctor || !form || !week) return;
    setError('');

    const errs: FieldErrors = {};
    if (!form.firstName.trim()) errs.firstName = t('crm.doctors.modal.required');
    if (!form.lastName.trim()) errs.lastName = t('crm.doctors.modal.required');
    if (!form.specialties.length) errs.specialties = t('crm.doctors.specialty.required');
    if (form.experienceYears && (!Number.isFinite(years) || years > 60)) {
      errs.experienceYears = t('crm.doctors.modal.invalid_experience');
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const initial = formFromDoctor(doctor);
    const body: UpdateClinicDoctorBody = {};
    if (form.firstName.trim() !== initial.firstName) body.firstName = form.firstName.trim();
    if (form.lastName.trim() !== initial.lastName) body.lastName = form.lastName.trim();
    if (!sameList(form.specialties, initial.specialties)) body.specialties = form.specialties;
    if (form.experienceYears !== initial.experienceYears) {
      body.experienceYears = Number.isFinite(years) ? years : 0;
    }
    if (form.priceFrom !== initial.priceFrom) body.priceFrom = Number.isFinite(price) ? price : 0;

    const schedule = scheduleFromWeek(week);
    if (!schedule.length) {
      setError(t('crm.doctors.schedule.errors.empty'));
      return;
    }
    if (Object.keys(validateWeek(week)).length) {
      setError(t('crm.doctors.schedule.errors.fix'));
      return;
    }
    const scheduleChanged =
      JSON.stringify(schedule) !== JSON.stringify(scheduleFromWeek(weekFromSchedule(doctor.schedule ?? []))) ||
      slotDuration !== (doctor.slotDuration || DEFAULT_SLOT) ||
      !doctor.schedule?.length;
    if (scheduleChanged) {
      body.schedule = schedule;
      body.slotDuration = slotDuration;
    }

    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }

    const token = readPersistedSession()?.accessToken;
    if (!token) return;

    setLoading(true);
    try {
      await clinicApi.updateDoctor(token, doctor.id, body);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('crm.doctors.edit.errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      open
      onClose={onClose}
      closeLabel={t('crm.doctors.modal.close')}
      icon={
        <ModalIcon>
          <Pencil className="h-5 w-5" strokeWidth={2} />
        </ModalIcon>
      }
      title={t('crm.doctors.edit.title')}
      subtitle={doctor.fullName}
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <PreviewCard
            name={fullName}
            initials={`${form.firstName.trim().charAt(0)}${form.lastName.trim().charAt(0)}`.toUpperCase()}
            specialty={form.specialties.join(', ')}
            years={Number.isFinite(years) ? years : null}
            showBadge={false}
          />

          <ModalSection title={t('crm.doctors.modal.section_personal')}>
            <div className="grid gap-3 tablet:grid-cols-2">
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
                inputMode="numeric"
                value={form.experienceYears}
                onChange={(e) => set('experienceYears', e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                error={fieldErrors.experienceYears}
                placeholder="0"
              />
              <AuthField
                label={t('crm.doctors.edit.price_from')}
                inputMode="numeric"
                value={groupDigits(form.priceFrom)}
                onChange={(e) => set('priceFrom', e.target.value.replace(/[^\d]/g, '').slice(0, 9))}
                hint={t('crm.doctors.edit.price_hint')}
                placeholder="150 000"
              />
            </div>
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
          />

          <ModalSection title={t('crm.doctors.modal.section_access')}>
            <AccessPanel doctor={doctor} onReset={onSaved} />
          </ModalSection>

          {error ? <FormError>{error}</FormError> : null}
        </ModalBody>

        <ModalFooter>
          <AuthButton variant="secondary" onClick={onClose} className="tablet:w-auto tablet:px-5">
            {t('crm.doctors.modal.cancel')}
          </AuthButton>
          <AuthButton type="submit" loading={loading} className="tablet:w-auto tablet:px-6">
            {t('crm.doctors.edit.save')}
          </AuthButton>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}

function AccessPanel({ doctor, onReset }: { doctor: ClinicDoctorRow; onReset: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'idle' | 'confirm' | 'done'>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStep('idle');
    setError('');
  }, [doctor.id]);

  async function reset() {
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      await clinicApi.resetDoctorPassword(token, doctor.id);
      setStep('done');
      onReset();
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(
        code === 'PASSWORD_RESET_FORBIDDEN'
          ? t('crm.doctors.edit.errors.reset_forbidden')
          : t('crm.doctors.edit.errors.generic'),
      );
      setStep('idle');
    } finally {
      setBusy(false);
    }
  }

  const pendingChange = doctor.mustChangePassword || step === 'done';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
        <Lock className="h-4 w-4 shrink-0 text-slate-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-700">
            {doctor.phone ? formatUzPhoneDisplay(doctor.phone) : '—'}
          </p>
          <p className="text-xs text-slate-500">{t('crm.doctors.edit.login_locked')}</p>
        </div>
        {pendingChange ? (
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <KeyRound className="h-3 w-3" strokeWidth={2.2} />
            {t('crm.doctors.status_default_password')}
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
            <ShieldCheck className="h-3 w-3" strokeWidth={2.2} />
            {t('crm.doctors.status_active')}
          </span>
        )}
      </div>

      {step === 'done' ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            {t('crm.doctors.edit.reset_done')}
          </p>
          <div className="mt-2.5 space-y-2">
            <CopyRow label={t('crm.doctors.modal.login')} value={formatUzPhoneDisplay(doctor.phone)} />
            <CopyRow label={t('crm.doctors.modal.password')} value={DEFAULT_DOCTOR_PASSWORD} mono />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3.5 tablet:flex-row tablet:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{t('crm.doctors.edit.reset_title')}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {step === 'confirm'
                ? t('crm.doctors.edit.reset_confirm', { password: DEFAULT_DOCTOR_PASSWORD })
                : t('crm.doctors.edit.reset_hint', { password: DEFAULT_DOCTOR_PASSWORD })}
            </p>
          </div>
          {step === 'confirm' ? (
            <div className="flex shrink-0 gap-2">
              <AuthButton
                variant="secondary"
                onClick={() => setStep('idle')}
                disabled={busy}
                className="!h-9 !w-auto px-3 !text-xs"
              >
                {t('crm.doctors.modal.cancel')}
              </AuthButton>
              <AuthButton
                variant="danger"
                onClick={() => void reset()}
                loading={busy}
                className="!h-9 !w-auto px-3 !text-xs"
              >
                {t('crm.doctors.edit.reset_confirm_yes')}
              </AuthButton>
            </div>
          ) : (
            <AuthButton
              variant="secondary"
              onClick={() => setStep('confirm')}
              className="!h-9 !w-auto shrink-0 px-3 !text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('crm.doctors.edit.reset_button')}
            </AuthButton>
          )}
        </div>
      )}

      {error ? <FormError>{error}</FormError> : null}
    </div>
  );
}
