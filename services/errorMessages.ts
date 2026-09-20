type ErrorLocale = 'uz' | 'en';

const MESSAGES: Record<ErrorLocale, Record<string, string>> = {
  uz: {
    SLOT_TAKEN: 'Bu vaqt band. Boshqa slotni tanlang.',
    UNAUTHORIZED: 'Sessiya tugadi. Qayta kiring.',
    TRIAL_EXPIRED: 'Sinov muddati tugadi. Obunani yangilang.',
    EMAIL_NOT_VERIFIED: 'Email tasdiqlanmagan. Pochtangizni tekshiring.',
    NETWORK_ERROR: 'Tarmoq xatosi. Internetni tekshirib, qayta urinib ko‘ring.',
  },
  en: {
    SLOT_TAKEN: 'This slot is taken. Please choose another time.',
    UNAUTHORIZED: 'Session expired. Please sign in again.',
    TRIAL_EXPIRED: 'Trial expired. Please renew your subscription.',
    EMAIL_NOT_VERIFIED: 'Email not verified. Check your inbox.',
    NETWORK_ERROR: 'Network error. Check your connection and try again.',
  },
};

export function getApiErrorMessage(
  code: string | undefined | null,
  locale: ErrorLocale = 'uz',
): string | undefined {
  if (!code) return undefined;
  return MESSAGES[locale][code] ?? MESSAGES.en[code];
}

export function resolveErrorLocale(raw?: string | null): ErrorLocale {
  const value = (raw ?? '').toLowerCase();
  if (value.startsWith('en')) return 'en';
  return 'uz';
}
