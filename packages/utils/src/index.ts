export function formatPrice(amount: number, locale = 'uz'): string {
  const intlLocale = toIntlLocale(locale);
  const formatted = new Intl.NumberFormat(intlLocale, {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currencySuffix(locale)}`;
}

export function formatDate(iso: string, locale = 'uz'): string {
  const d = new Date(iso + (iso.length <= 10 ? 'T12:00:00' : ''));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(toIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toIntlLocale(locale: string): string {
  switch (locale) {
    case 'uz':
    case 'uz-UZ':
      return 'uz-UZ';
    case 'uz-Cyrl':
    case 'uz-Cyrl-UZ':
      return 'uz-Cyrl-UZ';
    case 'ru':
    case 'ru-RU':
      return 'ru-RU';
    case 'en':
    case 'en-GB':
    case 'en-US':
      return 'en-GB';
    default:
      return locale || 'uz-UZ';
  }
}

function currencySuffix(locale: string): string {
  switch (locale) {
    case 'uz-Cyrl':
    case 'uz-Cyrl-UZ':
      return 'сўм';
    case 'ru':
    case 'ru-RU':
      return 'сум';
    case 'en':
    case 'en-GB':
    case 'en-US':
      return "so'm";
    default:
      return "so'm";
  }
}
