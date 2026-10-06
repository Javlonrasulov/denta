'use client';

import { ArrowLeft, Phone, Star, Stethoscope, UserRound, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, use, useMemo } from 'react';

import { DoctorFinanceTab } from '@/components/doctor-finance/DoctorFinanceTab';
import { AppPresence } from '@/components/doctors/AppPresence';
import { ScheduleSummary } from '@/components/doctors/ScheduleSummary';
import { AppShell } from '@/components/layout/AppShell';
import { clinicApi } from '@/lib/api/clinic-api';
import { useClinicQuery } from '@/lib/api/useClinicData';
import { formatUzPhoneDisplay } from '@/lib/auth/phone';
import { cn } from '@/lib/cn';
import { useDoctorFinanceAccess } from '@/lib/doctor-finance';
import { useCrmI18n } from '@/lib/i18n/useCrmI18n';

type Tab = 'profile' | 'finance';

export default function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <DoctorDetail id={decodeURIComponent(id)} />
    </Suspense>
  );
}

function DoctorDetail({ id }: { id: string }) {
  const { t, money } = useCrmI18n();
  const router = useRouter();
  const search = useSearchParams();
  const access = useDoctorFinanceAccess();
  const doctors = useClinicQuery('clinic-doctors', clinicApi.clinicDoctors);
  const doctor = useMemo(() => doctors.data?.find((d) => d.id === id) ?? null, [doctors.data, id]);
  const requested = search.get('tab') === 'finance' ? 'finance' : 'profile';
  const tab: Tab = requested === 'finance' && access.read ? 'finance' : 'profile';
  const workingDays = useMemo(() => doctor?.schedule.map((d) => d.dayOfWeek), [doctor]);

  const setTab = (next: Tab) => {
    const q = new URLSearchParams(search.toString());
    if (next === 'profile') q.delete('tab');
    else q.set('tab', next);
    router.replace(`/doctors/${encodeURIComponent(id)}${q.toString() ? `?${q}` : ''}`, { scroll: false });
  };

  const name = doctor?.fullName ?? t('crm.doctor_finance.page.doctor');
  const tabs: { id: Tab; label: string; icon: typeof Wallet }[] = [
    { id: 'profile', label: t('crm.doctor_finance.page.tab_profile'), icon: UserRound },
    ...(access.read ? [{ id: 'finance' as const, label: t('crm.doctor_finance.page.tab_finance'), icon: Wallet }] : []),
  ];

  return (
    <AppShell title={name} subtitle={t('crm.doctor_finance.page.subtitle')}>
      <div className="space-y-5">
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('crm.doctor_finance.page.back')}
        </Link>

        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 tablet:flex-row tablet:items-center">
          {doctor?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doctor.photoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-muted text-primary">
              <Stethoscope className="h-7 w-7" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold text-slate-900">{name}</h2>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {doctor
                ? [doctor.specialization, t('crm.doctors.years_short', { count: doctor.experienceYears })]
                    .filter(Boolean)
                    .join(' · ')
                : doctors.loading
                  ? '…'
                  : t('crm.doctor_finance.page.not_in_roster')}
            </p>
          </div>
          {doctor ? (
            <AppPresence
              seenAt={doctor.lastAppSeenAt}
              platform={doctor.lastAppPlatform}
              mustChangePassword={doctor.mustChangePassword}
            />
          ) : null}
        </section>

        {tabs.length > 1 ? (
          <div role="tablist" className="flex gap-1 border-b border-slate-200">
            {tabs.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={tab === tabId}
                onClick={() => setTab(tabId)}
                className={cn(
                  '-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition',
                  tab === tabId
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-800',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {tab === 'finance' ? (
          <DoctorFinanceTab doctorId={id} access={access} workingDays={workingDays} />
        ) : doctor ? (
          <div className="grid gap-4 laptop:grid-cols-2">
            <InfoCard title={t('crm.doctor_finance.page.contacts')}>
              <Row icon={Phone} label={t('crm.doctors.modal.phone')}>
                {doctor.phone ? formatUzPhoneDisplay(doctor.phone) : '—'}
              </Row>
              <Row icon={Star} label={t('crm.columns.rating')}>
                {doctor.rating.toFixed(1)}
              </Row>
              <Row icon={Wallet} label={t('crm.doctors.col_price')}>
                {doctor.priceFrom ? money(doctor.priceFrom) : '—'}
              </Row>
            </InfoCard>
            <InfoCard title={t('crm.doctors.schedule.col')}>
              <ScheduleSummary schedule={doctor.schedule ?? []} slotDuration={doctor.slotDuration} />
            </InfoCard>
          </div>
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            {doctors.loading ? '…' : t('crm.doctor_finance.page.not_in_roster')}
          </p>
        )}
      </div>
    </AppShell>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
      <h3 className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-400">{title}</h3>
      <div className="mt-3 space-y-2.5">{children}</div>
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="w-36 shrink-0 text-slate-500">{label}</span>
      <span className="min-w-0 flex-1 truncate font-medium text-slate-900">{children}</span>
    </div>
  );
}
