export type LocaleCode = 'uz' | 'uz-Cyrl' | 'ru' | 'en';

export const DEFAULT_LOCALE: LocaleCode = 'uz';

export const LOCALE_STORAGE_KEY = 'denta.clinic-web.locale';

/** Ready for future backend user-preference sync. */
export type LocalePreferenceSource = 'local' | 'user' | 'system';

export const LOCALE_OPTIONS: {
  code: LocaleCode;
  label: string;
  short: string;
}[] = [
  { code: 'uz', label: 'O‘zbekcha', short: 'UZ' },
  { code: 'uz-Cyrl', label: 'Ўзбекча', short: 'ЎЗ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
];

const INTL_BY_LOCALE: Record<LocaleCode, string> = {
  uz: 'uz-UZ',
  'uz-Cyrl': 'uz-Cyrl-UZ',
  ru: 'ru-RU',
  en: 'en-GB',
};

const CURRENCY_SUFFIX: Record<LocaleCode, string> = {
  uz: 'so‘m',
  'uz-Cyrl': 'сўм',
  ru: 'сум',
  en: 'so‘m',
};

export function isLocaleCode(value: unknown): value is LocaleCode {
  return value === 'uz' || value === 'uz-Cyrl' || value === 'ru' || value === 'en';
}

export function toIntlLocale(locale: string): string {
  if (isLocaleCode(locale)) return INTL_BY_LOCALE[locale];
  return locale || INTL_BY_LOCALE[DEFAULT_LOCALE];
}

export function currencySuffix(locale: string): string {
  if (isLocaleCode(locale)) return CURRENCY_SUFFIX[locale];
  return CURRENCY_SUFFIX[DEFAULT_LOCALE];
}

export function readStoredLocale(): LocaleCode {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocaleCode(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export function writeStoredLocale(locale: LocaleCode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}
