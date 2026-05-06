import type { Transaction } from '../transactions/schema';
import type { Currency, FxRateSnapshot, Money, YearMonth } from '../currency/types';
import { convert } from '../currency/convert';

export type { YearMonth };

export type CashFlowMonth = {
  yearMonth: YearMonth;
  inflow: Money;
  outflow: Money;
  netFlow: Money;
};

export function aggregateByMonth(
  transactions: Transaction[],
  displayCurrency: Currency,
  fx: FxRateSnapshot,
): CashFlowMonth[] {
  const buckets = new Map<YearMonth, { inflow: number; outflow: number }>();

  for (const tx of transactions) {
    const ym = tx.occurredOn.slice(0, 7) as YearMonth;
    const converted = convert(tx.amount, displayCurrency, fx);
    const bucket = buckets.get(ym) ?? { inflow: 0, outflow: 0 };
    if (tx.kind === 'income') {
      bucket.inflow += converted.amount;
    } else {
      bucket.outflow += converted.amount;
    }
    buckets.set(ym, bucket);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([yearMonth, { inflow, outflow }]) => ({
      yearMonth,
      inflow: { amount: inflow, currency: displayCurrency },
      outflow: { amount: outflow, currency: displayCurrency },
      netFlow: { amount: inflow - outflow, currency: displayCurrency },
    }));
}
