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

/**
 * Compact, gutter-legible label for chart Y-axis ticks. Receives an
 * already-major-units value (dollars, not cents; đồng, not minor units — the
 * `toMajor()` conversion happens upstream in each chart's data shape).
 *
 * - en-US / USD: `$0`, `$50K`, `$250K`, `$1M`, `$1.5M` via `Intl` compact currency.
 * - vi-VN / VND: `0`, `50tr`, `250tr`, `1 tỷ`, `1.5 tỷ`. Hand-rolled because
 *   `Intl` vi-VN compact emits `50 Tr` / `1 T` / `1,5 T` — capitalised Latin
 *   abbreviations with a comma decimal and a leading space, none of which match
 *   the Vietnamese gutter convention (`tr` = triệu, `tỷ` = billion, dot decimal).
 */
export function formatCompact(valueMajor: number, locale: Locale): string {
  if (locale === 'en-US') {
    // minimumFractionDigits: 0 is load-bearing: with only maximumFractionDigits
    // set, some ICU builds (Node's, in Vitest) pad to '$50.0K'/'$1.0M' while
    // others (Bun, Chrome) don't. Pinning the minimum normalises every runtime.
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(valueMajor);
  }

  const sign = valueMajor < 0 ? '-' : '';
  // Round to whole đồng once, up front, so the suffix thresholds and the displayed
  // value agree. Carbon tick generators can emit fractional values; comparing an
  // unrounded abs against the thresholds while rounding only in the sub-million
  // branch mislabels boundaries (999_999.6 → "1.000.000"; 999_999_999.6 → "1000tr").
  const abs = Math.round(Math.abs(valueMajor));
  if (abs < 1_000_000) return sign + abs.toLocaleString('vi-VN');
  if (abs < 1_000_000_000) return `${sign}${trimToOneDecimal(abs / 1_000_000)}tr`;
  return `${sign}${trimToOneDecimal(abs / 1_000_000_000)} tỷ`;
}

// One decimal place with trailing zero stripped, dot separator: 50 → '50', 1.5 → '1.5'.
function trimToOneDecimal(n: number): string {
  return Number(n.toFixed(1)).toString();
}
