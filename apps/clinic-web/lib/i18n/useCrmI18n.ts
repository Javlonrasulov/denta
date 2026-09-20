'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { formatDate, formatMoney, formatNumber, formatTime } from '@/lib/i18n';

export function useCrmI18n() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const money = useCallback(
    (amount: number) => formatMoney(amount, locale),
    [locale],
  );
  const number = useCallback(
    (value: number) => formatNumber(value, locale),
    [locale],
  );
  const date = useCallback(
    (iso: string, options?: Intl.DateTimeFormatOptions) =>
      formatDate(iso, locale, options),
    [locale],
  );
  const time = useCallback(
    (value: string) => formatTime(value, locale),
    [locale],
  );

  const status = useCallback(
    (code: string) => {
      const key = `crm.status.${code}`;
      const translated = t(key);
      return translated === key ? code : translated;
    },
    [t],
  );

  return { t, i18n, locale, money, number, date, time, status };
}
