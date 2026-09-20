'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@denta/locales/en/translation.json';
import ru from '@denta/locales/ru/translation.json';
import uz from '@denta/locales/uz/translation.json';
import uzCyrl from '@denta/locales/uz-Cyrl/translation.json';
import { DEFAULT_LOCALE, isLocaleCode, readStoredLocale } from './locale';

export const resources = {
  uz: { translation: uz },
  'uz-Cyrl': { translation: uzCyrl },
  ru: { translation: ru },
  en: { translation: en },
} as const;

const SUPPORTED_LNGS = ['uz', 'uz-Cyrl', 'ru', 'en'] as const;

function applyResourceBundles() {
  (Object.keys(resources) as Array<keyof typeof resources>).forEach((lng) => {
    i18n.addResourceBundle(lng, 'translation', resources[lng].translation, true, true);
  });
}

const initialLng =
  typeof window === 'undefined' ? DEFAULT_LOCALE : readStoredLocale();

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: initialLng,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LNGS],
    nonExplicitSupportedLngs: false,
    load: 'currentOnly',
    cleanCode: false,
    lowerCaseLng: false,
    compatibilityJSON: 'v4',
    interpolation: { escapeValue: false },
    returnNull: false,
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
  });
} else {
  applyResourceBundles();
}

/** Normalize i18n.language / resolvedLanguage to our LocaleCode. */
export function resolveLocaleCode(raw?: string | null): typeof DEFAULT_LOCALE | 'uz-Cyrl' | 'ru' | 'en' {
  const value = (raw ?? '').trim();
  if (isLocaleCode(value)) return value;
  // i18next sometimes reports variants; map known prefixes.
  if (value.toLowerCase().startsWith('uz-cyrl') || value === 'uz-Cyrl') return 'uz-Cyrl';
  if (value.toLowerCase().startsWith('ru')) return 'ru';
  if (value.toLowerCase().startsWith('en')) return 'en';
  if (value.toLowerCase().startsWith('uz')) return 'uz';
  return DEFAULT_LOCALE;
}

export default i18n;
export {
  currencySuffix,
  DEFAULT_LOCALE,
  isLocaleCode,
  LOCALE_OPTIONS,
  LOCALE_STORAGE_KEY,
  readStoredLocale,
  toIntlLocale,
  writeStoredLocale,
  type LocaleCode,
  type LocalePreferenceSource,
} from './locale';
export { formatDate, formatMoney, formatNumber, formatTime } from './format';
