import type { Money } from './types';

export type Locale = 'vi-VN' | 'en-US';

export function format(money: Money, locale: Locale): string {
  const major = money.currency === 'VND' ? money.amount : money.amount / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: money.currency === 'VND' ? 0 : 2,
    maximumFractionDigits: money.currency === 'VND' ? 0 : 2,
  }).format(major);
}
