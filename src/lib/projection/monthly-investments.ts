import type { Currency, FxRateSnapshot, Money, YearMonth } from '../currency/types';
import type { Transaction } from '../transactions/schema';
import { convert } from '../currency/convert';

const CONTRIBUTION_MONTHS = 60;

function addMonths(ym: string, n: number): string {
  const year = parseInt(ym.slice(0, 4), 10);
  const month = parseInt(ym.slice(5, 7), 10); // 1-indexed
  const d = new Date(Date.UTC(year, month - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function aggregateMonthlyInvestments(
  transactions: Transaction[],
  ratio: number,
  displayCurrency: Currency,
  fx: FxRateSnapshot,
): Money[] {
  if (transactions.length === 0) {
    return Array.from({ length: CONTRIBUTION_MONTHS }, () => ({
      amount: 0,
      currency: displayCurrency,
    }));
  }

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

  const anchorYM = Array.from(buckets.keys()).sort()[0];
  const result: Money[] = [];

  for (let i = 0; i < CONTRIBUTION_MONTHS; i++) {
    const ym = addMonths(anchorYM, i) as YearMonth;
    const bucket = buckets.get(ym);
    if (!bucket) {
      result.push({ amount: 0, currency: displayCurrency });
      continue;
    }
    const netFlow = bucket.inflow - bucket.outflow;
    const contribution = netFlow > 0 ? Math.floor(netFlow * ratio) : 0;
    result.push({ amount: contribution, currency: displayCurrency });
  }

  return result;
}
