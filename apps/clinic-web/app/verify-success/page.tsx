'use client';

import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthCard, AuthShell } from '@/components/auth/AuthShell';
import { AuthButton } from '@/components/auth/AuthFields';
import { useAuth } from '@/components/providers/AuthProvider';

function formatTrialEnd(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale === 'uz-Cyrl' ? 'uz-Cyrl' : locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export default function VerifySuccessPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const endDate = useMemo(
    () => formatTrialEnd(user?.subscription.trialEndsAt, i18n.language),
    [user?.subscription.trialEndsAt, i18n.language],
  );

  return (
    <AuthShell>
      <AuthCard title={t('clinicAuth.success.title')} subtitle={t('clinicAuth.success.subtitle')}>
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" strokeWidth={1.75} />
          </div>
          <p className="text-sm text-slate-600">{t('clinicAuth.success.trial_started')}</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {t('clinicAuth.success.ends_on', { date: endDate })}
          </p>
        </div>
        <AuthButton type="button" onClick={() => router.replace('/onboarding')}>
          {t('clinicAuth.success.cta')}
        </AuthButton>
      </AuthCard>
    </AuthShell>
  );
}
