/**
 * Formats appointment YYYY-MM-DD for display in the active locale.
 */
export function formatAppointmentDate(isoDate: string, locale: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;

  const intlLocale = toIntlLocale(locale);
  return d.toLocaleDateString(intlLocale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function shortAppointmentRef(id: string): string {
  const clean = id.replace(/^appt-?/i, '');
  return clean.length > 8 ? clean.slice(-6).toUpperCase() : clean.toUpperCase();
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
