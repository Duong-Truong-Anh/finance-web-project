import { describe, it, expect } from 'vitest';
import { aggregateMonthlyInvestments } from './monthly-investments';
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

describe('aggregateMonthlyInvestments', () => {
  it('empty transactions → 60 zeros', () => {
    const result = aggregateMonthlyInvestments([], 0.40, 'VND', FX);
    expect(result).toHaveLength(60);
    expect(result.every((m) => m.amount === 0)).toBe(true);
    expect(result.every((m) => m.currency === 'VND')).toBe(true);
  });

  it('single income in month 1 → entry 0 is floor(income * ratio), entries 1..59 are zero', () => {
    const result = aggregateMonthlyInvestments(
      [makeIncome(5_500_000, '2026-01-15')],
      0.40,
      'VND',
      FX,
    );
    expect(result).toHaveLength(60);
    expect(result[0].amount).toBe(Math.floor(5_500_000 * 0.40));
    expect(result.slice(1).every((m) => m.amount === 0)).toBe(true);
  });

  it('income + larger expense in same month → entry is zero (negative net flow)', () => {
    const result = aggregateMonthlyInvestments(
      [makeIncome(1_000_000, '2026-01-01'), makeExpense(5_000_000, '2026-01-05')],
      0.40,
      'VND',
      FX,
    );
    expect(result[0].amount).toBe(0);
  });

  it('70 months of constant data → entries 0..59 populated; months 60+ ignored', () => {
    const transactions: Transaction[] = [];
    for (let i = 0; i < 70; i++) {
      const year = 2026 + Math.floor(i / 12);
      const month = String((i % 12) + 1).padStart(2, '0');
      transactions.push(makeIncome(5_000_000, `${year}-${month}-01`));
    }
    const result = aggregateMonthlyInvestments(transactions, 0.40, 'VND', FX);
    expect(result).toHaveLength(60);
    expect(result.every((m) => m.amount === Math.floor(5_000_000 * 0.40))).toBe(true);
  });

  it('mixed VND + USD with displayCurrency USD → results in USD minor units', () => {
    const usdIncome: Transaction = {
      id: 'TEST00000000000000000000003',
      kind: 'income',
      name: 'USD income',
      amount: { amount: 100_00, currency: 'USD' }, // 100 USD = 10000 cents
      occurredOn: '2026-01-01',
      notes: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const result = aggregateMonthlyInvestments([usdIncome], 0.40, 'USD', FX);
    expect(result[0].currency).toBe('USD');
    // 10000 cents * 0.40 = 4000 cents (floor)
    expect(result[0].amount).toBe(4000);
  });

  it('gap month (transactions in months 1 and 5, none in 2/3/4) → middle entries are zero', () => {
    const result = aggregateMonthlyInvestments(
      [
        makeIncome(5_000_000, '2026-01-15'),
        makeIncome(5_000_000, '2026-05-15'),
      ],
      0.40,
      'VND',
      FX,
    );
    expect(result).toHaveLength(60);
    expect(result[0].amount).toBe(Math.floor(5_000_000 * 0.40)); // Jan
    expect(result[1].amount).toBe(0); // Feb
    expect(result[2].amount).toBe(0); // Mar
    expect(result[3].amount).toBe(0); // Apr
    expect(result[4].amount).toBe(Math.floor(5_000_000 * 0.40)); // May
  });

  it('floor behavior: ratio produces non-integer minor amount → result is floored', () => {
    // 5_500_003 * 0.40 = 2_200_001.2 → floor = 2_200_001
    const result = aggregateMonthlyInvestments(
      [makeIncome(5_500_003, '2026-01-01')],
      0.40,
      'VND',
      FX,
    );
    expect(result[0].amount).toBe(2_200_001);
  });
});
