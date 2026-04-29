import 'server-only';
import { cookies } from 'next/headers';
import type { Theme } from '@/src/lib/settings/repository';
import type { Currency } from '@/src/lib/currency/types';

const VALID_THEMES = new Set<Theme>(['g90', 'g100', 'white']);
const VALID_CURRENCIES = new Set<Currency>(['VND', 'USD']);

export async function readTheme(): Promise<Theme> {
  const value = (await cookies()).get('flowstate-theme')?.value;
  return VALID_THEMES.has(value as Theme) ? (value as Theme) : 'g90';
}

export async function readCurrency(): Promise<Currency> {
  const value = (await cookies()).get('flowstate-currency')?.value;
  return VALID_CURRENCIES.has(value as Currency) ? (value as Currency) : 'VND';
}
