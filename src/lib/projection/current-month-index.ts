import type { Transaction } from '@/src/lib/transactions/schema';

/**
 * Returns the series index for "today" anchored at the earliest transaction's YYYY-MM.
 * Returns null for empty transactions so the caller decides what to render.
 * Clamped to [0, 360]. Pure: never reads Date.now().
 */
export function currentMonthIndex(
  transactions: Transaction[],
  today: Date,
): number | null {
  if (transactions.length === 0) return null;

  // Find the earliest YYYY-MM across all transactions (same anchor convention as aggregateMonthlyInvestments)
  let anchor = transactions[0].occurredOn.slice(0, 7);
  for (const tx of transactions) {
    const ym = tx.occurredOn.slice(0, 7);
    if (ym < anchor) anchor = ym;
  }

  const anchorYear = Number(anchor.slice(0, 4));
  const anchorMonth = Number(anchor.slice(5, 7));

  const todayYear = today.getUTCFullYear();
  const todayMonth = today.getUTCMonth() + 1;

  const months = (todayYear - anchorYear) * 12 + (todayMonth - anchorMonth);

  return Math.min(360, Math.max(0, months));
}
