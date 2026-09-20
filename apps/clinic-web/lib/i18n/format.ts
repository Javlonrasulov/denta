import {
  currencySuffix,
  DEFAULT_LOCALE,
  isLocaleCode,
  toIntlLocale,
  type LocaleCode,
} from './locale';

export function formatMoney(amount: number, locale: string = DEFAULT_LOCALE): string {
  const code: LocaleCode = isLocaleCode(locale) ? locale : DEFAULT_LOCALE;
  const formatted = new Intl.NumberFormat(toIntlLocale(code), {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currencySuffix(code)}`;
}

export function formatNumber(value: number, locale: string = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(
  iso: string,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(toIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function formatTime(isoOrTime: string, locale: string = DEFAULT_LOCALE): string {
  if (/^\d{1,2}:\d{2}/.test(isoOrTime)) return isoOrTime;
  const d = new Date(isoOrTime);
  if (Number.isNaN(d.getTime())) return isoOrTime;
  return d.toLocaleTimeString(toIntlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
  });
}
