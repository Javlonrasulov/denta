import type { LocaleCode } from '@/types';

/** Fixed month names (Hermes Intl has no reliable `uz` month data). Mirrors clinic-web `lib/legal/format.ts`. */
const MONTHS: Record<LocaleCode, string[]> = {
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  'uz-Cyrl': ['январ', 'феврал', 'март', 'апрел', 'май', 'июн', 'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** Formats a `YYYY-MM-DD` date, e.g. `27-sentabr, 2026`. */
export function formatLegalDate(isoDate: string, locale: LocaleCode): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, mm, dd] = match;
  const month = MONTHS[locale][Number(mm) - 1];
  if (!month) return isoDate;
  const day = String(Number(dd));
  switch (locale) {
    case 'uz':
    case 'uz-Cyrl':
      return `${day}-${month}, ${year}`;
    case 'ru':
      return `${day} ${month} ${year} г.`;
    case 'en':
      return `${month} ${day}, ${year}`;
  }
}
