'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n, {
  readStoredLocale,
  resolveLocaleCode,
  writeStoredLocale,
  type LocaleCode,
} from '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = readStoredLocale();
    document.documentElement.lang = stored;

    if (resolveLocaleCode(i18n.language) !== stored) {
      void i18n.changeLanguage(stored);
    }

    const onChanged = (lng: string) => {
      document.documentElement.lang = resolveLocaleCode(lng);
    };

    i18n.on('languageChanged', onChanged);
    return () => {
      i18n.off('languageChanged', onChanged);
    };
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
  return resolveLocaleCode(i18n.resolvedLanguage ?? i18n.language);
}
