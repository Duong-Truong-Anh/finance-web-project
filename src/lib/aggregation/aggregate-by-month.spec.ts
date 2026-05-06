import { describe, it, expect } from 'vitest';
import { aggregateByMonth } from './aggregate-by-month';
import type { Transaction } from '../transactions/schema';
import type { FxRateSnapshot } from '../currency/types';

const FX: FxRateSnapshot = {
  base: 'USD',
  rates: { VND: 25000, USD: 1 },
  fetchedAt: '2026-05-01T00:00:00.000Z',
};

function makeTx(overrides: Partial<Transaction> & Pick<Transaction, 'kind' | 'occurredOn'> & { amountVal: number; currency?: 'VND' | 'USD' }): Transaction {
  const { amountVal, currency = 'VND', ...rest } = overrides;
  return {
    id: 'test-id',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    name: 'Test',
    notes: null,
    amount: { amount: amountVal, currency },
    ...rest,
  };
}

describe('aggregateByMonth', () => {
  it('returns empty array for empty input', () => {
    expect(aggregateByMonth([], 'VND', FX)).toEqual([]);
  });

  it('single VND income produces correct inflow with zero outflow', () => {
    const tx = makeTx({ kind: 'income', occurredOn: '2026-04-15', amountVal: 1_000_000 });
    const [month] = aggregateByMonth([tx], 'VND', FX);
    expect(month.yearMonth).toBe('2026-04');
    expect(month.inflow.amount).toBeGreaterThan(0);
    expect(month.outflow.amount).toBe(0);
    expect(month.netFlow.amount).toBe(month.inflow.amount);
  });

  it('single VND expense produces zero inflow with positive outflow and negative netFlow', () => {
    const tx = makeTx({ kind: 'expense', occurredOn: '2026-04-10', amountVal: 500_000 });
    const [month] = aggregateByMonth([tx], 'VND', FX);
    expect(month.inflow.amount).toBe(0);
    expect(month.outflow.amount).toBeGreaterThan(0);
    expect(month.netFlow.amount).toBeLessThan(0);
    expect(month.netFlow.amount).toBe(-month.outflow.amount);
  });

  it('one income + one expense in same month produces populated fields with correct netFlow', () => {
    const income = makeTx({ kind: 'income', occurredOn: '2026-03-01', amountVal: 2_000_000 });
    const expense = makeTx({ kind: 'expense', occurredOn: '2026-03-20', amountVal: 800_000 });
    const [month] = aggregateByMonth([income, expense], 'VND', FX);
    expect(month.inflow.amount).toBe(2_000_000);
    expect(month.outflow.amount).toBe(800_000);
    expect(month.netFlow.amount).toBe(1_200_000);
  });

  it('three transactions across three months are sorted ascending', () => {
    const txs = [
      makeTx({ kind: 'income', occurredOn: '2026-05-01', amountVal: 100_000 }),
      makeTx({ kind: 'income', occurredOn: '2026-03-01', amountVal: 200_000 }),
      makeTx({ kind: 'income', occurredOn: '2026-04-01', amountVal: 150_000 }),
    ];
    const result = aggregateByMonth(txs, 'VND', FX);
    expect(result.map((m) => m.yearMonth)).toEqual(['2026-03', '2026-04', '2026-05']);
  });

  it('converts VND amounts to USD via the supplied FX snapshot', () => {
    // 50 000 000 VND / 25 000 = 2 000 USD = 200 000 cents
    const tx = makeTx({ kind: 'income', occurredOn: '2026-04-01', amountVal: 50_000_000, currency: 'VND' });
    const [month] = aggregateByMonth([tx], 'USD', FX);
    expect(month.inflow.currency).toBe('USD');
    expect(month.inflow.amount).toBe(200_000);
    expect(month.netFlow.amount).toBe(200_000);
  });

  it('groups transactions on different days within the same month into one bucket', () => {
    const txs = [
      makeTx({ kind: 'income', occurredOn: '2026-06-01', amountVal: 100_000 }),
      makeTx({ kind: 'income', occurredOn: '2026-06-15', amountVal: 200_000 }),
      makeTx({ kind: 'expense', occurredOn: '2026-06-28', amountVal: 50_000 }),
    ];
    const result = aggregateByMonth(txs, 'VND', FX);
    expect(result).toHaveLength(1);
    expect(result[0].yearMonth).toBe('2026-06');
    expect(result[0].inflow.amount).toBe(300_000);
    expect(result[0].outflow.amount).toBe(50_000);
  });

  it('month with no income but expenses has zero inflow and negative netFlow', () => {
    const tx = makeTx({ kind: 'expense', occurredOn: '2026-07-10', amountVal: 300_000 });
    const [month] = aggregateByMonth([tx], 'VND', FX);
    expect(month.inflow.amount).toBe(0);
    expect(month.inflow.currency).toBe('VND');
    expect(month.outflow.amount).toBe(300_000);
    expect(month.netFlow.amount).toBe(-300_000);
  });
});
