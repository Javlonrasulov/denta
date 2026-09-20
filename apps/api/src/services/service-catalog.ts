export type ServiceLocaleMap = {
  uz: string;
  'uz-Cyrl': string;
  ru: string;
  en: string;
};

export type MasterServiceTemplate = {
  nameKey: string;
  category: string;
  defaultDuration: number;
  defaultPriceUzs: number;
  translations: ServiceLocaleMap;
};

/** Master dental service catalog templates (seeded into Service table). */
export const MASTER_SERVICE_CATALOG: MasterServiceTemplate[] = [
  {
    nameKey: 'service.consultation',
    category: 'general',
    defaultDuration: 30,
    defaultPriceUzs: 150_000,
    translations: {
      uz: 'Konsultatsiya',
      'uz-Cyrl': 'Консультация',
      ru: 'Консультация',
      en: 'Consultation',
    },
  },
  {
    nameKey: 'service.professional_cleaning',
    category: 'hygiene',
    defaultDuration: 45,
    defaultPriceUzs: 350_000,
    translations: {
      uz: 'Professional tozalash',
      'uz-Cyrl': 'Профессионал тозалаш',
      ru: 'Профессиональная чистка',
      en: 'Professional cleaning',
    },
  },
  {
    nameKey: 'service.filling',
    category: 'therapy',
    defaultDuration: 60,
    defaultPriceUzs: 450_000,
    translations: {
      uz: 'Kariyes davolash / Plomba',
      'uz-Cyrl': 'Кариес даволаш / Пломба',
      ru: 'Лечение кариеса / Пломба',
      en: 'Caries treatment / Filling',
    },
  },
  {
    nameKey: 'service.root_canal',
    category: 'endodontics',
    defaultDuration: 90,
    defaultPriceUzs: 800_000,
    translations: {
      uz: 'Kanal davolash',
      'uz-Cyrl': 'Канал даволаш',
      ru: 'Лечение каналов',
      en: 'Root canal treatment',
    },
  },
  {
    nameKey: 'service.whitening',
    category: 'cosmetic',
    defaultDuration: 60,
    defaultPriceUzs: 1_200_000,
    translations: {
      uz: 'Oqartirish',
      'uz-Cyrl': 'Оқартириш',
      ru: 'Отбеливание',
      en: 'Whitening',
    },
  },
  {
    nameKey: 'service.orthodontic_consult',
    category: 'orthodontics',
    defaultDuration: 40,
    defaultPriceUzs: 200_000,
    translations: {
      uz: 'Ortodontik konsultatsiya',
      'uz-Cyrl': 'Ортодонтик консультация',
      ru: 'Ортодонтическая консультация',
      en: 'Orthodontic consultation',
    },
  },
  {
    nameKey: 'service.implant_consult',
    category: 'surgery',
    defaultDuration: 40,
    defaultPriceUzs: 250_000,
    translations: {
      uz: 'Implant konsultatsiyasi',
      'uz-Cyrl': 'Имплант консультацияси',
      ru: 'Консультация по имплантации',
      en: 'Implant consultation',
    },
  },
];

export function resolveServiceName(
  translations: unknown,
  fallback: string,
  locale?: string,
): string {
  if (!translations || typeof translations !== 'object') return fallback;
  const map = translations as Record<string, string>;
  const normalized = (locale ?? 'uz').trim();
  if (map[normalized]) return map[normalized];
  if (normalized.startsWith('uz') && map.uz) return map.uz;
  if (normalized.startsWith('ru') && map.ru) return map.ru;
  if (normalized.startsWith('en') && map.en) return map.en;
  return map.uz ?? map.en ?? fallback;
}
