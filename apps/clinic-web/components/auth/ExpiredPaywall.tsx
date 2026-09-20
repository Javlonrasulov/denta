'use client';

import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/components/providers/AuthProvider';

const SUPPORT = {
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '+998 71 200 00 00',
  telegram: process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM ?? 'https://t.me/dentauz',
};

export function ExpiredPaywall() {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{t('clinicAuth.expired.title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {t('clinicAuth.expired.body')}
        </p>
        <div className="mt-6 space-y-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>
            <span className="text-slate-500">{t('clinicAuth.expired.phone')}: </span>
            <a href={`tel:${SUPPORT.phone.replace(/\s/g, '')}`} className="font-semibold text-primary">
              {SUPPORT.phone}
            </a>
          </p>
          <p>
            <span className="text-slate-500">Telegram: </span>
            <a
              href={SUPPORT.telegram}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary"
            >
              {SUPPORT.telegram.replace('https://t.me/', '@')}
            </a>
          </p>
        </div>
        <p className="mt-4 text-xs text-slate-400">{t('clinicAuth.expired.data_kept')}</p>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {t('clinicAuth.expired.logout')}
        </button>
      </div>
    </div>
  );
}
