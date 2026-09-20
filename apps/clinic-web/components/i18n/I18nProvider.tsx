'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n, {
  DEFAULT_LOCALE,
  readStoredLocale,
  writeStoredLocale,
  type LocaleCode,
} from '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const locale = readStoredLocale();
    document.documentElement.lang = locale;
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export async function setAppLocale(locale: LocaleCode): Promise<void> {
  writeStoredLocale(locale);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
  await i18n.changeLanguage(locale);
}

export function getAppLocale(): LocaleCode {
  const lng = i18n.language;
  if (lng === 'uz' || lng === 'uz-Cyrl' || lng === 'ru' || lng === 'en') return lng;
  return DEFAULT_LOCALE;
}
