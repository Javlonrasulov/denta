'use client';

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Trash2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import { AuthButton, AuthField } from '@/components/auth/AuthFields';
import { CrmQueryState } from '@/components/crm/CrmQueryState';
import { SpecialtyPicker, applyCatalogChange } from '@/components/doctors/SpecialtyPicker';
import { useAuth } from '@/components/providers/AuthProvider';
import { AppShell } from '@/components/layout/AppShell';
import type { GeoPoint, ResolvedAddress } from '@/components/settings/LocationPicker';
import {
  WeeklySchedule,
  issuesToDayErrors,
  scheduleFromWorkingHours,
  scheduleIssues,
  scheduleToWorkingHours,
  type ScheduleDay,
} from '@/components/settings/WeeklySchedule';
import { FormError, ModalFooter, ModalShell } from '@/components/users/ModalShell';
import { Panel } from '@/components/ui/crm';
import {
  CLINIC_PROFILE_UPDATED_EVENT,
  clinicApi,
  type ClinicHoursIssue,
  type ClinicMe,
  type ScheduleConflict,
  type UpdateClinicBody,
} from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { readPersistedSession } from '@/lib/auth/session';
import { cn } from '@/lib/cn';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

const LocationPicker = dynamic(
  () => import('@/components/settings/LocationPicker').then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => <div className="h-[360px] animate-pulse rounded-xl bg-slate-100" />,
  },
);

const TIMEZONES = [
  'Asia/Tashkent',
  'Asia/Samarkand',
  'Asia/Almaty',
  'Asia/Bishkek',
  'Asia/Dushanbe',
  'Asia/Ashgabat',
  'Europe/Moscow',
  'Asia/Dubai',
];

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70';

function primaryBranch(clinic: ClinicMe) {
  return clinic.branches?.find((b) => b.isPrimary) ?? clinic.branches?.[0];
}

function initialPoint(clinic: ClinicMe): GeoPoint | null {
  const b = primaryBranch(clinic);
  if (!b) return null;
  const latitude = Number(b.latitude);
  const longitude = Number(b.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function canEditClinic(isMock: boolean): boolean {
  const perms = readPersistedSession()?.activeWorkspace?.permissions ?? (isMock ? ['*'] : []);
  return perms.includes('*') || perms.includes('settings:manage');
}

export default function SettingsPage() {
  const { t } = useCrmI18n();
  const query = useClinicQuery('clinic-me', clinicApi.clinicMe);
  const [latest, setLatest] = useState<ClinicMe | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const data = latest ?? query.data;

  return (
    <AppShell title={t('crm.settings.title')} subtitle={t('crm.settings.subtitle')}>
      <CrmQueryState
        apiConfigured={query.apiConfigured}
        loading={query.loading}
        error={query.error}
      >
        {data ? (
          <ClinicSettingsForm
            key={`${data.id}:${resetKey}`}
            initial={data}
            onSaved={setLatest}
            onReset={() => setResetKey((k) => k + 1)}
          />
        ) : null}
      </CrmQueryState>
    </AppShell>
  );
}

function ClinicSettingsForm({
  initial,
  onSaved,
  onReset,
}: {
  initial: ClinicMe;
  onSaved: (next: ClinicMe) => void;
  onReset: () => void;
}) {
  const { t, locale } = useCrmI18n();
  const { isMock } = useAuth();
  const canEdit = canEditClinic(isMock);

  const [clinic, setClinic] = useState(initial);
  const branch = primaryBranch(initial);

  const [name, setName] = useState(initial.name ?? '');
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [email, setEmail] = useState(initial.email ?? '');
  const [about, setAbout] = useState(initial.about ?? '');
  const [timezone, setTimezone] = useState(initial.timezone || 'Asia/Tashkent');
  const [priceFrom, setPriceFrom] = useState(
    initial.priceFromUzs != null ? String(initial.priceFromUzs) : '',
  );
  const [specs, setSpecs] = useState<string[]>(initial.specializations ?? []);

  const [city, setCity] = useState(branch?.city ?? '');
  const [region, setRegion] = useState(branch?.region ?? '');
  const [address, setAddress] = useState(branch?.address ?? '');
  const [point, setPoint] = useState<GeoPoint | null>(() => initialPoint(initial));

  const [schedule, setSchedule] = useState<ScheduleDay[]>(() =>
    scheduleFromWorkingHours(branch?.workingHours),
  );
  const [serverIssues, setServerIssues] = useState<ClinicHoursIssue[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);
  const [conflicts, setConflicts] = useState<{ list: ScheduleConflict[]; total: number } | null>(
    null,
  );

  const scheduleJson = JSON.stringify(schedule);
  const snapshot = JSON.stringify({
    name,
    phone,
    email,
    about,
    timezone,
    priceFrom,
    specs,
    city,
    region,
    address,
    point,
    scheduleJson,
  });
  const [baseline, setBaseline] = useState(snapshot);
  const [savedSchedule, setSavedSchedule] = useState(scheduleJson);
  const dirty = snapshot !== baseline;

  const scheduleErrors = useMemo(() => {
    const live = scheduleIssues(schedule);
    return issuesToDayErrors(live.length ? live : serverIssues, t);
  }, [schedule, serverIssues, t]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const timezoneOptions = TIMEZONES.includes(timezone) ? TIMEZONES : [timezone, ...TIMEZONES];

  function onAddressResolved(resolved: ResolvedAddress) {
    const moved = Boolean(resolved.address || resolved.city);
    if (moved) setAddress(resolved.address);
    if (resolved.city) setCity(resolved.city);
    if (moved) setRegion(resolved.region);
  }

  function onScheduleChange(next: ScheduleDay[]) {
    setSchedule(next);
    setServerIssues([]);
    if (errors.hours) {
      setErrors(({ hours: _hours, ...rest }) => rest);
      setFormError('');
    }
  }

  /** The server already applied the catalog change to the clinic, so the baseline follows it. */
  function onCatalogChange(from: string, to: string | null) {
    setBaseline((prev) => {
      const parsed = JSON.parse(prev) as { specs: string[] };
      parsed.specs = applyCatalogChange(parsed.specs, from, to);
      return JSON.stringify(parsed);
    });
    const next = {
      ...clinic,
      specializations: applyCatalogChange(clinic.specializations ?? [], from, to),
    };
    setClinic(next);
    onSaved(next);
  }

  function afterSave(next: ClinicMe) {
    setClinic(next);
    onSaved(next);
    window.dispatchEvent(new Event(CLINIC_PROFILE_UPDATED_EVENT));
  }

  async function uploadMedia(kind: 'logo' | 'cover', file: File) {
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setUploading(kind);
    setFormError('');
    try {
      afterSave(await clinicApi.uploadClinicMedia(token, kind, file));
      setToast(t('crm.settings.saved'));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('crm.settings.save_failed'));
    } finally {
      setUploading(null);
    }
  }

  async function removeMedia(kind: 'logo' | 'cover') {
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setUploading(kind);
    setFormError('');
    try {
      afterSave(
        await clinicApi.updateClinic(token, kind === 'logo' ? { logoUrl: '' } : { coverUrl: '' }),
      );
      setToast(t('crm.settings.saved'));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('crm.settings.save_failed'));
    } finally {
      setUploading(null);
    }
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    const required = t('crm.settings.required');
    if (name.trim().length < 2) errs.name = t('crm.settings.name_short');
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = t('crm.settings.email_invalid');
    }
    if (priceFrom.trim() && !(Number(priceFrom) >= 0)) {
      errs.priceFrom = t('crm.settings.price_invalid');
    }
    const hasLocationInput = Boolean(point || city.trim() || address.trim());
    if (hasLocationInput) {
      if (!point) errs.point = t('crm.settings.pin_required');
      if (!city.trim()) errs.city = required;
      if (!address.trim()) errs.address = required;
    }
    if (scheduleIssues(schedule).length) errs.hours = t('crm.settings.schedule.err_fix');
    return errs;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      setFormError(errs.hours && Object.keys(errs).length === 1 ? errs.hours : t('crm.settings.fix_errors'));
      return;
    }

    const token = readPersistedSession()?.accessToken;
    if (!token) return;

    if (point && scheduleJson !== savedSchedule) {
      setSaving(true);
      try {
        const preview = await clinicApi.previewScheduleConflicts(
          token,
          scheduleToWorkingHours(schedule),
        );
        if (preview.total > 0) {
          setConflicts({ list: preview.conflicts, total: preview.total });
          setSaving(false);
          return;
        }
      } catch (err) {
        if (!applyServerError(err)) {
          setSaving(false);
          return;
        }
      }
    }
    await save(token);
  }

  /** Returns true when the error was not a schedule validation error. */
  function applyServerError(err: unknown): boolean {
    const details = (err as { details?: { issues?: ClinicHoursIssue[] } })?.details;
    if (details?.issues?.length) {
      setServerIssues(details.issues);
      setFormError(err instanceof Error ? err.message : t('crm.settings.save_failed'));
      return false;
    }
    return true;
  }

  async function save(token: string) {
    const submittedSnapshot = snapshot;
    const submittedSchedule = scheduleJson;
    const scheduleChanged = Boolean(point) && submittedSchedule !== savedSchedule;
    const body: UpdateClinicBody = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      about: about.trim(),
      timezone,
      specializations: specs,
      ...(priceFrom.trim() ? { priceFromUzs: Math.round(Number(priceFrom)) } : {}),
      ...(point
        ? {
            workingHours: scheduleToWorkingHours(schedule),
            location: {
              address: address.trim(),
              city: city.trim(),
              region: region.trim(),
              latitude: Number(point.latitude.toFixed(7)),
              longitude: Number(point.longitude.toFixed(7)),
            },
          }
        : {}),
    };

    setSaving(true);
    setConflicts(null);
    try {
      afterSave(await clinicApi.updateClinic(token, body));
      setBaseline(submittedSnapshot);
      if (scheduleChanged) setSavedSchedule(submittedSchedule);
      setToast(
        scheduleChanged ? t('crm.settings.schedule.toast_saved') : t('crm.settings.changes_saved'),
      );
    } catch (err) {
      if (applyServerError(err)) {
        setFormError(err instanceof Error ? err.message : t('crm.settings.save_failed'));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 pb-4">
      <Panel title={t('crm.settings.section_media')}>
        <div className="space-y-4">
          <MediaPicker
            kind="cover"
            url={clinic.coverUrl}
            busy={uploading === 'cover'}
            disabled={!canEdit}
            label={t('crm.settings.cover')}
            hint={t('crm.settings.media_hint')}
            uploadLabel={t('crm.settings.upload')}
            removeLabel={t('crm.settings.remove')}
            onPick={(f) => void uploadMedia('cover', f)}
            onRemove={() => void removeMedia('cover')}
          />
          <MediaPicker
            kind="logo"
            url={clinic.logoUrl}
            busy={uploading === 'logo'}
            disabled={!canEdit}
            label={t('crm.settings.logo')}
            hint={t('crm.settings.media_hint')}
            uploadLabel={t('crm.settings.upload')}
            removeLabel={t('crm.settings.remove')}
            onPick={(f) => void uploadMedia('logo', f)}
            onRemove={() => void removeMedia('logo')}
          />
        </div>
      </Panel>

      <Panel title={t('crm.settings.clinic_profile')}>
        <fieldset disabled={!canEdit} className="grid gap-4 tablet:grid-cols-2">
          <div className="tablet:col-span-2">
            <AuthField
              label={t('crm.settings.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              autoComplete="organization"
            />
          </div>
          <AuthField
            label={t('crm.settings.phone')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            type="tel"
            autoComplete="tel"
          />
          <AuthField
            label={t('crm.settings.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="info@clinic.uz"
            type="email"
            autoComplete="email"
          />
          <label className="block space-y-1.5">
            <span className="block text-sm font-medium text-slate-700">
              {t('crm.settings.timezone')}
            </span>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={cn(inputClass, 'h-12')}
            >
              {timezoneOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
          <AuthField
            label={t('crm.settings.price_from')}
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value.replace(/[^\d]/g, ''))}
            error={errors.priceFrom}
            inputMode="numeric"
            placeholder="100000"
            hint={t('crm.settings.currency_value')}
          />
          <div className="tablet:col-span-2">
            {canEdit ? (
              <SpecialtyPicker
                value={specs}
                onChange={setSpecs}
                onCatalogChange={onCatalogChange}
                label={t('crm.settings.specializations')}
              />
            ) : (
              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-slate-700">
                  {t('crm.settings.specializations')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {specs.length ? (
                    specs.map((s) => (
                      <span
                        key={s}
                        className="inline-flex h-8 items-center rounded-full bg-white px-3 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <label className="block space-y-1.5 tablet:col-span-2">
            <span className="block text-sm font-medium text-slate-700">
              {t('crm.settings.about')}
            </span>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={4}
              placeholder={t('crm.settings.about_placeholder')}
              className={cn(inputClass, 'resize-y py-3')}
            />
          </label>
        </fieldset>
      </Panel>

      <Panel title={t('crm.settings.section_location')}>
        <div className="space-y-4">
          <LocationPicker
            value={point}
            onChange={(p) => {
              setPoint(p);
              setErrors((prev) => ({ ...prev, point: '' }));
            }}
            onAddressResolved={onAddressResolved}
            disabled={!canEdit}
            lang={locale.startsWith('uz') ? 'uz' : locale}
            labels={{
              searchPlaceholder: t('crm.settings.map_search_placeholder'),
              search: t('crm.settings.map_search'),
              myLocation: t('crm.settings.map_my_location'),
              noResults: t('crm.settings.map_no_results'),
              searchFailed: t('crm.settings.map_search_failed'),
              geoFailed: t('crm.settings.map_geo_failed'),
              hint: t('crm.settings.map_hint'),
            }}
          />
          {errors.point ? (
            <p className="text-xs font-medium text-red-600">{errors.point}</p>
          ) : null}
          {point ? (
            <p className="text-xs text-slate-500">
              {t('crm.settings.coordinates')}: {point.latitude.toFixed(6)},{' '}
              {point.longitude.toFixed(6)}
            </p>
          ) : null}
          <fieldset disabled={!canEdit} className="grid gap-4 tablet:grid-cols-2">
            <AuthField
              label={t('crm.settings.city')}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              error={errors.city}
            />
            <AuthField
              label={t('crm.settings.region')}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
            <div className="tablet:col-span-2">
              <AuthField
                label={t('crm.settings.address')}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                error={errors.address}
                placeholder={t('crm.settings.address_placeholder')}
              />
            </div>
          </fieldset>
        </div>
      </Panel>

      <Panel title={t('crm.settings.section_hours')}>
        {!point ? (
          <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {t('crm.settings.hours_need_location')}
          </p>
        ) : null}
        <WeeklySchedule
          value={schedule}
          onChange={onScheduleChange}
          disabled={!canEdit || !point}
          errors={scheduleErrors}
        />
      </Panel>

      {canEdit && (dirty || saving || formError) ? (
        <div
          role="region"
          aria-label={t('crm.settings.schedule.unsaved')}
          className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl shadow-slate-900/10 tablet:flex-row tablet:items-center tablet:px-5"
        >
          <div className="min-w-0 flex-1">
            {formError ? (
              <FormError>{formError}</FormError>
            ) : (
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <span aria-hidden className="h-2 w-2 rounded-full bg-amber-500" />
                {t('crm.settings.schedule.unsaved')}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <AuthButton
              variant="secondary"
              disabled={saving}
              onClick={onReset}
              className="h-10 flex-1 tablet:w-auto tablet:flex-none tablet:px-5"
            >
              {t('crm.settings.schedule.cancel')}
            </AuthButton>
            <AuthButton
              type="submit"
              loading={saving}
              className="h-10 flex-1 shadow-none tablet:w-auto tablet:flex-none tablet:px-6"
            >
              {t('crm.settings.save')}
            </AuthButton>
          </div>
        </div>
      ) : null}
      {!canEdit ? (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          {t('crm.settings.read_only')}
        </p>
      ) : null}

      {toast ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl tablet:inset-x-auto tablet:bottom-6 tablet:right-6"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      ) : null}

      <ModalShell
        open={Boolean(conflicts)}
        onClose={() => setConflicts(null)}
        icon={<AlertTriangle className="h-5 w-5" />}
        title={t('crm.settings.schedule.conflict_title')}
        closeLabel={t('crm.settings.schedule.conflict_back')}
        size="sm"
      >
        {conflicts ? (
          <ConflictList
            conflicts={conflicts.list}
            total={conflicts.total}
            saving={saving}
            onBack={() => setConflicts(null)}
            onConfirm={() => {
              const token = readPersistedSession()?.accessToken;
              if (token) void save(token);
            }}
          />
        ) : null}
      </ModalShell>
    </form>
  );
}

function ConflictList({
  conflicts,
  total,
  saving,
  onBack,
  onConfirm,
}: {
  conflicts: ScheduleConflict[];
  total: number;
  saving: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const { t } = useCrmI18n();
  const reasonKey = {
    lunch: 'crm.settings.schedule.reason_lunch',
    closed: 'crm.settings.schedule.reason_closed',
    outside_hours: 'crm.settings.schedule.reason_outside',
  } as const;
  const dayLabel = (iso: string) => {
    const [y, m, d] = iso.split('-');
    const dow = new Date(`${iso}T12:00:00`).getDay();
    return `${t(`crm.settings.schedule.short_${dow}`)}, ${d}.${m}.${y}`;
  };

  return (
    <>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <p className="text-sm text-slate-600">{t('crm.settings.schedule.conflict_text')}</p>
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {conflicts.map((c) => (
            <li key={c.appointmentId} className="flex items-start justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{c.patientName}</p>
                <p className="truncate text-caption text-slate-500">
                  {c.doctorName} · {t(reasonKey[c.reason])}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {c.time}–{c.endTime}
                </p>
                <p className="text-caption text-slate-500">{dayLabel(c.date)}</p>
              </div>
            </li>
          ))}
        </ul>
        {total > conflicts.length ? (
          <p className="text-caption text-slate-500">
            {t('crm.settings.schedule.conflict_more', { count: total - conflicts.length })}
          </p>
        ) : null}
      </div>
      <ModalFooter>
        <AuthButton variant="secondary" onClick={onBack} className="h-10 tablet:w-auto tablet:px-5">
          {t('crm.settings.schedule.conflict_back')}
        </AuthButton>
        <AuthButton
          loading={saving}
          onClick={onConfirm}
          className="h-10 shadow-none tablet:w-auto tablet:px-5"
        >
          {t('crm.settings.schedule.conflict_confirm')}
        </AuthButton>
      </ModalFooter>
    </>
  );
}

function MediaPicker({
  kind,
  url,
  busy,
  disabled,
  label,
  hint,
  uploadLabel,
  removeLabel,
  onPick,
  onRemove,
}: {
  kind: 'logo' | 'cover';
  url?: string | null;
  busy: boolean;
  disabled: boolean;
  label: string;
  hint: string;
  uploadLabel: string;
  removeLabel: string;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center">
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-50 text-slate-300',
          kind === 'logo' ? 'h-20 w-20 rounded-2xl' : 'h-28 w-full rounded-xl tablet:w-72',
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : kind === 'logo' ? (
          <Building2 className="h-8 w-8" />
        ) : (
          <ImagePlus className="h-8 w-8" />
        )}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{hint}</p>
        {!disabled ? (
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <ImagePlus className="h-4 w-4" />
              {uploadLabel}
            </button>
            {url ? (
              <button
                type="button"
                disabled={busy}
                onClick={onRemove}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {removeLabel}
              </button>
            ) : null}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) onPick(file);
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
