import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en/translation.json';
import ru from '@/locales/ru/translation.json';
import uz from '@/locales/uz/translation.json';
import uzCyrl from '@/locales/uz-Cyrl/translation.json';

export const resources = {
  uz: { translation: uz },
  'uz-Cyrl': { translation: uzCyrl },
  ru: { translation: ru },
  en: { translation: en },
} as const;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'uz',
    fallbackLng: 'uz',
    compatibilityJSON: 'v4',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
