'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthButton, AuthField } from '@/components/auth/AuthFields';
import { useAuth } from '@/components/providers/AuthProvider';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import type { GeoPoint, ResolvedAddress } from '@/components/settings/LocationPicker';
import {
  scheduleFromWorkingHours,
  scheduleToWorkingHours,
} from '@/components/settings/WeeklySchedule';
import { TimePicker, fromMinutes, toMinutes } from '@/components/ui/TimePicker';
import {
  CatalogServiceItem,
  clinicApi,
} from '@/lib/api/clinic-api';
import { readPersistedSession } from '@/lib/auth/session';
import { cn } from '@/lib/cn';

const LocationPicker = dynamic(
  () => import('@/components/settings/LocationPicker').then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => <div className="h-[360px] animate-pulse rounded-xl bg-slate-100" />,
  },
);

const STEPS = 6;
const LAST_SLOT_MINUTES = 23 * 60 + 45;

type LocationErrors = Partial<Record<'point' | 'city' | 'address', string>>;

type SelectedService = {
  serviceId: string;
  priceUzs: number;
  durationMinutes: number;
};

export default function OnboardingPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, updateOnboarding, ready } = useAuth();
  const [step, setStep] = useState(
    Math.min(STEPS, Math.max(1, (user?.onboardingStep ?? 0) + 1)),
  );
  const [saving, setSaving] = useState(false);

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [locationErrors, setLocationErrors] = useState<LocationErrors>({});
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [doctorsNote, setDoctorsNote] = useState('');

  const [catalog, setCatalog] = useState<CatalogServiceItem[]>([]);
  const [selected, setSelected] = useState<Record<string, SelectedService>>({});
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const locale = i18n.language || 'uz';

  const loadCatalog = useCallback(async () => {
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const rows = await clinicApi.serviceCatalog(token);
      setCatalog(rows);
      const defaults: Record<string, SelectedService> = {};
      for (const row of rows) {
        if (row.key === 'service.consultation') {
          defaults[row.id] = {
            serviceId: row.id,
            priceUzs: row.defaultPriceUzs,
            durationMinutes: row.defaultDurationMinutes,
          };
        }
      }
      setSelected((prev) => (Object.keys(prev).length ? prev : defaults));
    } catch (e) {
      setCatalogError(e instanceof Error ? e.message : 'Failed to load catalog');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === 4 && catalog.length === 0) {
      void loadCatalog();
    }
  }, [step, catalog.length, loadCatalog]);

  useEffect(() => {
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    let cancelled = false;
    clinicApi
      .clinicMe(token)
      .then((clinic) => {
        const branch = clinic.branches?.find((b) => b.isPrimary) ?? clinic.branches?.[0];
        if (cancelled || !branch) return;
        setCity(branch.city ?? '');
        setAddress(branch.address ?? '');
        setRegion(branch.region ?? '');
        const latitude = Number(branch.latitude);
        const longitude = Number(branch.longitude);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          setPoint({ latitude, longitude });
        }
        const firstOpen = branch.workingHours?.find((d) => !d.closed);
        if (firstOpen) {
          setOpenTime(firstOpen.open);
          setCloseTime(firstOpen.close);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  function changeOpenTime(next: string) {
    setOpenTime(next);
    const open = toMinutes(next);
    if (toMinutes(closeTime) <= open) {
      setCloseTime(fromMinutes(Math.min(open + 60, LAST_SLOT_MINUTES)));
    }
  }

  function serviceLabel(row: CatalogServiceItem): string {
    return row.names?.[locale] ?? row.names?.uz ?? row.name;
  }

  function toggleService(row: CatalogServiceItem) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[row.id]) {
        delete next[row.id];
      } else {
        next[row.id] = {
          serviceId: row.id,
          priceUzs: row.defaultPriceUzs,
          durationMinutes: row.defaultDurationMinutes,
        };
      }
      return next;
    });
  }

  function updatePrice(id: string, priceUzs: number) {
    setSelected((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      return { ...prev, [id]: { ...cur, priceUzs } };
    });
  }

  function updateDuration(id: string, durationMinutes: number) {
    setSelected((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      return { ...prev, [id]: { ...cur, durationMinutes } };
    });
  }

  async function persistServices() {
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    const items = Object.values(selected);
    if (!items.length) return;
    await clinicApi.setupServices(token, items);
  }

  function locationBody() {
    if (!point) return undefined;
    return {
      address: address.trim(),
      city: city.trim(),
      region: region.trim(),
      latitude: Number(point.latitude.toFixed(7)),
      longitude: Number(point.longitude.toFixed(7)),
    };
  }

  async function persistLocation() {
    const required = t('crm.settings.required');
    const errs: LocationErrors = {};
    if (!point) errs.point = t('crm.settings.pin_required');
    if (!city.trim()) errs.city = required;
    if (!address.trim()) errs.address = required;
    setLocationErrors(errs);
    if (Object.keys(errs).length) {
      throw new Error(t('crm.settings.fix_errors'));
    }
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    await clinicApi.updateClinic(token, { location: locationBody() });
  }

  async function persistHours() {
    const token = readPersistedSession()?.accessToken;
    if (!token) return;
    const workingHours = scheduleToWorkingHours(
      scheduleFromWorkingHours(null).map((d) => ({ ...d, openTime, closeTime })),
    );
    await clinicApi.updateClinic(token, { workingHours, location: locationBody() });
  }

  function clearLocationErrors(...fields: Array<keyof LocationErrors>) {
    setLocationErrors((prev) => {
      const next = { ...prev };
      for (const f of fields) delete next[f];
      return next;
    });
    setCatalogError(null);
  }

  function onAddressResolved(resolved: ResolvedAddress) {
    const moved = Boolean(resolved.address || resolved.city);
    if (moved) setAddress(resolved.address);
    if (resolved.city) setCity(resolved.city);
    if (moved) setRegion(resolved.region);
    clearLocationErrors(
      ...(resolved.address ? (['address'] as const) : []),
      ...(resolved.city ? (['city'] as const) : []),
    );
  }

  async function goNext(completed = false) {
    setSaving(true);
    setCatalogError(null);
    try {
      if (step === 2) {
        await persistLocation();
      }
      if (step === 3) {
        await persistHours();
      }
      if (step === 4) {
        await persistServices();
      }
      const done = completed || step >= STEPS;
      await updateOnboarding(done ? STEPS : step, done);
      if (done) {
        router.replace('/overview');
      } else {
        setStep((s) => s + 1);
      }
    } catch (e) {
      setCatalogError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function skip() {
    await goNext(false);
  }

  async function finish() {
    await goNext(true);
  }

  const skippable = step >= 5;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-4 tablet:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            O
          </span>
          <span className="font-bold text-primary">ORADENT</span>
        </div>
        <LanguageSelector />
      </header>

      <main className="mx-auto max-w-xl px-4 py-10 tablet:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">
            {t('clinicAuth.onboarding.progress', { current: step, total: STEPS })}
          </p>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: STEPS }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition',
                  i < step ? 'bg-primary' : 'bg-slate-200',
                )}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/[0.04] tablet:p-8">
          <h1 className="text-xl font-bold text-slate-900">
            {t(`clinicAuth.onboarding.step${step}_title`)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t(`clinicAuth.onboarding.step${step}_body`)}
          </p>

          <div className="mt-6 space-y-4">
            {step === 1 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="font-semibold">{user?.clinicName}</span>
                <br />
                {user?.adminFirstName} {user?.adminLastName}
                <br />
                {user?.email} · {user?.phone}
              </p>
            ) : null}

            {step === 2 ? (
              <>
                <LocationPicker
                  value={point}
                  onChange={(p) => {
                    setPoint(p);
                    clearLocationErrors('point');
                  }}
                  onAddressResolved={onAddressResolved}
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
                {locationErrors.point ? (
                  <p className="text-xs font-medium text-red-600">{locationErrors.point}</p>
                ) : null}
                <AuthField
                  label={t('clinicAuth.onboarding.city')}
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    clearLocationErrors('city');
                  }}
                  error={locationErrors.city}
                />
                <AuthField
                  label={t('clinicAuth.onboarding.address')}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    clearLocationErrors('address');
                  }}
                  error={locationErrors.address}
                  placeholder={t('crm.settings.address_placeholder')}
                />
              </>
            ) : null}

            {step === 3 ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-sm">
                  <span className="block font-medium text-slate-700">
                    {t('clinicAuth.onboarding.open')}
                  </span>
                  <TimePicker
                    value={openTime}
                    onChange={changeOpenTime}
                    label={t('clinicAuth.onboarding.open')}
                    isOptionDisabled={(time) => toMinutes(time) >= LAST_SLOT_MINUTES}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5 text-sm">
                  <span className="block font-medium text-slate-700">
                    {t('clinicAuth.onboarding.close')}
                  </span>
                  <TimePicker
                    value={closeTime}
                    onChange={setCloseTime}
                    label={t('clinicAuth.onboarding.close')}
                    isOptionDisabled={(time) => toMinutes(time) <= toMinutes(openTime)}
                    className="w-full"
                  />
                </div>
                <p className="col-span-2 text-xs text-slate-500">
                  {t('clinicAuth.onboarding.hours_hint')}
                </p>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-3">
                {catalogLoading ? (
                  <p className="text-sm text-slate-500">Loading…</p>
                ) : null}
                {catalog.map((row) => {
                  const isOn = Boolean(selected[row.id]);
                  return (
                    <div
                      key={row.id}
                      className={cn(
                        'rounded-xl border px-3 py-3 transition',
                        isOn
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 bg-slate-50',
                      )}
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={isOn}
                          onChange={() => toggleService(row)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {serviceLabel(row)}
                          </p>
                          <p className="text-xs text-slate-500">{row.category}</p>
                          {isOn ? (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <label className="block text-xs">
                                <span className="text-slate-600">
                                  {t('clinicAuth.onboarding.price_uzs')}
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  value={selected[row.id]?.priceUzs ?? row.defaultPriceUzs}
                                  onChange={(e) =>
                                    updatePrice(row.id, Number(e.target.value) || 0)
                                  }
                                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2"
                                />
                              </label>
                              <label className="block text-xs">
                                <span className="text-slate-600">
                                  {t('clinicAuth.onboarding.duration_min')}
                                </span>
                                <input
                                  type="number"
                                  min={5}
                                  value={
                                    selected[row.id]?.durationMinutes ??
                                    row.defaultDurationMinutes
                                  }
                                  onChange={(e) =>
                                    updateDuration(
                                      row.id,
                                      Number(e.target.value) || 30,
                                    )
                                  }
                                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2"
                                />
                              </label>
                            </div>
                          ) : null}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {step === 5 ? (
              <textarea
                value={doctorsNote}
                onChange={(e) => setDoctorsNote(e.target.value)}
                rows={4}
                placeholder={t('clinicAuth.onboarding.doctors_placeholder')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            ) : null}

            {step === 6 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                {t('clinicAuth.onboarding.photos_hint')}
              </div>
            ) : null}

            {catalogError ? <p className="text-sm text-rose-600">{catalogError}</p> : null}
          </div>

          <div className="mt-8 flex flex-col gap-3 tablet:flex-row">
            {skippable ? (
              <AuthButton type="button" variant="secondary" disabled={saving} onClick={() => void skip()}>
                {t('clinicAuth.onboarding.skip')}
              </AuthButton>
            ) : null}
            <AuthButton
              type="button"
              loading={saving}
              onClick={() => void (step >= STEPS ? finish() : goNext(false))}
            >
              {step >= STEPS
                ? t('clinicAuth.onboarding.finish')
                : t('clinicAuth.onboarding.next')}
            </AuthButton>
          </div>
        </div>
      </main>
    </div>
  );
}
