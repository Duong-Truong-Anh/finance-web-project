import type { Currency, FxRateSnapshot, Money } from './types';

export class FxUnsupportedPairError extends Error {
  constructor(from: string, to: string) {
    super(`Unsupported FX pair: ${from} → ${to}`);
    this.name = 'FxUnsupportedPairError';
  }
}

// Half-to-even (banker's) rounding. Assumes n >= 0 per Money discipline (§2).
function roundHalfToEven(n: number): number {
  const floor = Math.floor(n);
  const diff = n - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  // Exact halfway — round to even
  return floor % 2 === 0 ? floor : floor + 1;
}

export function convert(money: Money, toCurrency: Currency, fx: FxRateSnapshot): Money {
  if (money.currency === toCurrency) return money;

  if (money.currency === 'VND' && toCurrency === 'USD') {
    // VND đồng → USD cents: amount / vndPerUsd * 100
    const cents = roundHalfToEven((money.amount / fx.rates.VND) * 100);
    return { amount: cents, currency: 'USD' };
  }

  if (money.currency === 'USD' && toCurrency === 'VND') {
    // USD cents → VND đồng: amount * vndPerUsd / 100
    const dong = roundHalfToEven((money.amount * fx.rates.VND) / 100);
    return { amount: dong, currency: 'VND' };
  }

  throw new FxUnsupportedPairError(money.currency, toCurrency);
}
