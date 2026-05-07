import { describe, it, expect } from 'vitest';
import { currentMonthIndex } from './current-month-index';
import type { Transaction } from '@/src/lib/transactions/schema';

function makeTx(occurredOn: string): Transaction {
  return {
    id: 'test-id',
    kind: 'income',
    name: 'Test',
    amount: { amount: 1000, currency: 'VND' },
    occurredOn,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('currentMonthIndex', () => {
  it('returns null for empty transactions', () => {
    expect(currentMonthIndex([], new Date('2026-05-07T00:00:00.000Z'))).toBeNull();
  });

  it('returns 0 when today is in the same month as the anchor', () => {
    const txs = [makeTx('2026-01-15')];
    expect(currentMonthIndex(txs, new Date('2026-01-15T00:00:00.000Z'))).toBe(0);
  });

  it('returns 6 when today is 6 months after the anchor', () => {
    const txs = [makeTx('2026-01-01')];
    expect(currentMonthIndex(txs, new Date('2026-07-20T00:00:00.000Z'))).toBe(6);
  });

  it('clamps to 360 when today is beyond the 30-year horizon', () => {
    const txs = [makeTx('2020-01-01')];
    // 2055-12 vs 2020-01 = 35 years 11 months = 431 months, clamped to 360
    expect(currentMonthIndex(txs, new Date('2055-12-31T00:00:00.000Z'))).toBe(360);
  });

  it('clamps to 0 when today is before the anchor month', () => {
    const txs = [makeTx('2030-01-15')];
    expect(currentMonthIndex(txs, new Date('2025-06-15T00:00:00.000Z'))).toBe(0);
  });
});
