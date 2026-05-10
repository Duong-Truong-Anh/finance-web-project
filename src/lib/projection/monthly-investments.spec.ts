import { describe, it, expect } from 'vitest';
import { aggregateMonthlyContributions } from './monthly-investments';
import { ASSET_ALLOCATION, ASSET_CLASSES } from '../portfolio/schema';
import type { Transaction } from '../transactions/schema';
import type { FxRateSnapshot } from '../currency/types';

const FX: FxRateSnapshot = {
  base: 'USD',
  rates: { VND: 25000, USD: 1 },
  fetchedAt: '2026-05-01T00:00:00.000Z',
};

function makeIncome(amount: number, date: string): Transaction {
  return {
    id: 'TEST00000000000000000000001',
    kind: 'income',
    name: 'Income',
    amount: { amount, currency: 'VND' },
    occurredOn: date,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeExpense(amount: number, date: string): Transaction {
  return {
    id: 'TEST00000000000000000000002',
    kind: 'expense',
    name: 'Expense',
    amount: { amount, currency: 'VND' },
    occurredOn: date,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('aggregateMonthlyContributions', () => {
  it('empty transactions → all 5 assets return 60 zeros', () => {
    const result = aggregateMonthlyContributions([], ASSET_ALLOCATION, 'VND', FX);
    for (const asset of ASSET_CLASSES) {
      expect(result[asset]).toHaveLength(60);
      expect(result[asset].every((m) => m.amount === 0)).toBe(true);
      expect(result[asset].every((m) => m.currency === 'VND')).toBe(true);
    }
  });

  it('single income → stocks gets floor(income × 0.50), each non-stock gets floor(income × 0.10)', () => {
    const result = aggregateMonthlyContributions(
      [makeIncome(5_500_000, '2026-01-15')],
      ASSET_ALLOCATION,
      'VND',
      FX,
    );
    expect(result.stocks[0].amount).toBe(Math.floor(5_500_000 * 0.50));   // 2,750,000
    expect(result.savings[0].amount).toBe(Math.floor(5_500_000 * 0.10));  // 550,000
    expect(result.cash[0].amount).toBe(Math.floor(5_500_000 * 0.10));     // 550,000
    expect(result.gold[0].amount).toBe(Math.floor(5_500_000 * 0.10));     // 550,000
    expect(result.usd[0].amount).toBe(Math.floor(5_500_000 * 0.10));      // 550,000
    // All remaining months zero
    for (const asset of ASSET_CLASSES) {
      expect(result[asset].slice(1).every((m) => m.amount === 0)).toBe(true);
    }
  });

  it('income + larger expense in same month → all entries zero (negative net flow)', () => {
    const result = aggregateMonthlyContributions(
      [makeIncome(1_000_000, '2026-01-01'), makeExpense(5_000_000, '2026-01-05')],
      ASSET_ALLOCATION,
      'VND',
      FX,
    );
    for (const asset of ASSET_CLASSES) {
      expect(result[asset][0].amount).toBe(0);
    }
  });

  it('70 months of constant data → entries 0..59 populated; months 60+ ignored', () => {
    const transactions: Transaction[] = [];
    for (let i = 0; i < 70; i++) {
      const year = 2026 + Math.floor(i / 12);
      const month = String((i % 12) + 1).padStart(2, '0');
      transactions.push(makeIncome(5_000_000, `${year}-${month}-01`));
    }
    const result = aggregateMonthlyContributions(transactions, ASSET_ALLOCATION, 'VND', FX);
    for (const asset of ASSET_CLASSES) {
      expect(result[asset]).toHaveLength(60);
      expect(
        result[asset].every((m) => m.amount === Math.floor(5_000_000 * ASSET_ALLOCATION[asset])),
      ).toBe(true);
    }
  });

  it('mixed VND + USD with displayCurrency USD → all results in USD minor units', () => {
    const usdIncome: Transaction = {
      id: 'TEST00000000000000000000003',
      kind: 'income',
      name: 'USD income',
      amount: { amount: 100_00, currency: 'USD' }, // 10000 cents
      occurredOn: '2026-01-01',
      notes: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const result = aggregateMonthlyContributions([usdIncome], ASSET_ALLOCATION, 'USD', FX);
    for (const asset of ASSET_CLASSES) {
      expect(result[asset][0].currency).toBe('USD');
    }
    // 10000 cents × 0.50 = 5000 cents for stocks
    expect(result.stocks[0].amount).toBe(5000);
    // 10000 cents × 0.10 = 1000 cents for each non-stock
    expect(result.savings[0].amount).toBe(1000);
  });

  it('gap month (transactions in months 1 and 5, none in 2/3/4) → middle entries zero', () => {
    const result = aggregateMonthlyContributions(
      [
        makeIncome(5_000_000, '2026-01-15'),
        makeIncome(5_000_000, '2026-05-15'),
      ],
      ASSET_ALLOCATION,
      'VND',
      FX,
    );
    for (const asset of ASSET_CLASSES) {
      expect(result[asset]).toHaveLength(60);
      expect(result[asset][0].amount).toBe(Math.floor(5_000_000 * ASSET_ALLOCATION[asset])); // Jan
      expect(result[asset][1].amount).toBe(0); // Feb
      expect(result[asset][2].amount).toBe(0); // Mar
      expect(result[asset][3].amount).toBe(0); // Apr
      expect(result[asset][4].amount).toBe(Math.floor(5_000_000 * ASSET_ALLOCATION[asset])); // May
    }
  });

  it('floor behavior: stocks gets floored minor amount', () => {
    // floor(5_500_003 × 0.50) = floor(2_750_001.5) = 2_750_001
    const result = aggregateMonthlyContributions(
      [makeIncome(5_500_003, '2026-01-01')],
      ASSET_ALLOCATION,
      'VND',
      FX,
    );
    expect(result.stocks[0].amount).toBe(2_750_001);
  });

  it('worked example: constant 5.5M net flow → stocks 2,750,000 + each non-stock 550,000 per month', () => {
    const result = aggregateMonthlyContributions(
      [makeIncome(18_000_000, '2026-01-01'), makeExpense(12_500_000, '2026-01-15')],
      ASSET_ALLOCATION,
      'VND',
      FX,
    );
    expect(result.stocks[0].amount).toBe(2_750_000);
    expect(result.savings[0].amount).toBe(550_000);
    expect(result.cash[0].amount).toBe(550_000);
    expect(result.gold[0].amount).toBe(550_000);
    expect(result.usd[0].amount).toBe(550_000);
  });
});
