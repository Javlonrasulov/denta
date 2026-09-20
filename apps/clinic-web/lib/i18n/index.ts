'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@denta/locales/en/translation.json';
import ru from '@denta/locales/ru/translation.json';
import uz from '@denta/locales/uz/translation.json';
import uzCyrl from '@denta/locales/uz-Cyrl/translation.json';
import { DEFAULT_LOCALE, readStoredLocale } from './locale';

export const resources = {
  uz: { translation: uz },
  'uz-Cyrl': { translation: uzCyrl },
  ru: { translation: ru },
  en: { translation: en },
} as const;

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
    compatibilityJSON: 'v4',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
} else {
  applyResourceBundles();
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
