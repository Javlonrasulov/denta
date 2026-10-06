import {
  currencySuffix,
  DEFAULT_LOCALE,
  isLocaleCode,
  toIntlLocale,
  type LocaleCode,
} from './locale';

export function formatMoney(amount: number, locale: string = DEFAULT_LOCALE): string {
  const code: LocaleCode = isLocaleCode(locale) ? locale : DEFAULT_LOCALE;
  // Uzbek groups thousands with spaces; runtimes without uz ICU data fall back to commas.
  const formatted = code.startsWith('uz')
    ? `${amount < 0 ? '-' : ''}${String(Math.round(Math.abs(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')}`
    : new Intl.NumberFormat(toIntlLocale(code), {
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
  const formatted = d.toLocaleDateString(toIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
  // Runtimes without full ICU data for uz-Latn render months as "M10".
  if (/\bM\d{1,2}\b/.test(formatted)) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  }
  return formatted;
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
