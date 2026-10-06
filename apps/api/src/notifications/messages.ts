export type NotificationLocale = 'uz' | 'uz-Cyrl' | 'ru' | 'en';

export function normalizeNotificationLocale(locale: string | null | undefined): NotificationLocale {
  if (locale === 'ru' || locale === 'en' || locale === 'uz-Cyrl') return locale;
  return 'uz';
}

function day(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return d && m && y ? `${d}.${m}.${y}` : ymd;
}

const APPOINTMENT_CREATED_TITLE: Record<NotificationLocale, string> = {
  uz: 'Yangi qabul',
  'uz-Cyrl': 'Янги қабул',
  ru: 'Новая запись',
  en: 'New appointment',
};

export function appointmentCreatedMessage(
  locale: string | null | undefined,
  v: { patientName: string; date: string; time: string; serviceName?: string },
): { title: string; body: string } {
  const l = normalizeNotificationLocale(locale);
  const body = [v.patientName, `${day(v.date)} ${v.time}`, v.serviceName]
    .filter(Boolean)
    .join(' · ');
  return { title: APPOINTMENT_CREATED_TITLE[l], body };
}
