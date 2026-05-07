import { describe, it, expect } from 'vitest';
import { computeProjection } from './compute-projection';
import { monthlyRateFromAnnual } from './rates';
import type { ProjectionInput } from './types';
import type { Transaction } from '../transactions/schema';
import type { FxRateSnapshot } from '../currency/types';

const FX: FxRateSnapshot = {
  base: 'USD',
  rates: { VND: 25000, USD: 1 },
  fetchedAt: '2026-05-01T00:00:00.000Z',
};

// Compute expected end-of-month-60 value using the closed-form annuity-due formula.
// V_60 = PMT * (1+gm) * [(1+gm)^60 - 1] / gm
// This is independent of the iterative implementation so that the test is not circular.
function annuityDueFV(pmt: number, annual: number): number {
  const gm = monthlyRateFromAnnual(annual);
  return pmt * (1 + gm) * (Math.pow(1 + gm, 60) - 1) / gm;
}

function makeIncome(amount: number, yearMonth: string): Transaction {
  return {
    id: `INC${yearMonth.replace('-', '')}000000000000000`,
    kind: 'income',
    name: 'Income',
    amount: { amount, currency: 'VND' },
    occurredOn: `${yearMonth}-01`,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeExpense(amount: number, yearMonth: string): Transaction {
  return {
    id: `EXP${yearMonth.replace('-', '')}000000000000000`,
    kind: 'expense',
    name: 'Expense',
    amount: { amount, currency: 'VND' },
    occurredOn: `${yearMonth}-15`,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

// Build worked-example transactions: 60 months of 18M income + 12.5M expense.
// Anchor month: 2026-01.
function workedExampleTransactions(): Transaction[] {
  const txs: Transaction[] = [];
  for (let i = 0; i < 60; i++) {
    const year = 2026 + Math.floor(i / 12);
    const month = String((i % 12) + 1).padStart(2, '0');
    const ym = `${year}-${month}`;
    txs.push(makeIncome(18_000_000, ym));
    txs.push(makeExpense(12_500_000, ym));
  }
  return txs;
}

const WORKED_INPUT: ProjectionInput = {
  transactions: workedExampleTransactions(),
  ratio: 0.40,
  displayCurrency: 'VND',
  fx: FX,
};

describe('computeProjection', () => {
  describe('worked example (spec §9)', () => {
    it('series[60] matches closed-form annuity-due FV for all three rates within ±1', () => {
      const { scenarios } = computeProjection(WORKED_INPUT);

      for (let i = 0; i < 3; i++) {
        const rate = [0.15, 0.175, 0.20][i];
        const expected = Math.round(annuityDueFV(2_200_000, rate));
        const actual = scenarios[i].series[60].portfolioValue.amount;
        expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
      }
    });

    it('yr30 milestone matches V_60 * (1+g)^25 within ±1', () => {
      const { scenarios } = computeProjection(WORKED_INPUT);

      for (let i = 0; i < 3; i++) {
        const rate = [0.15, 0.175, 0.20][i];
        const v60 = annuityDueFV(2_200_000, rate);
        const expected = Math.round(v60 * Math.pow(1 + rate, 25));
        const actual = scenarios[i].milestones.yr30.amount;
        expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
      }
    });

    it('totalContributed is exactly 132_000_000 for all scenarios', () => {
      const { scenarios } = computeProjection(WORKED_INPUT);
      // floor(5_500_000 * 0.40) = 2_200_000 exactly; 2_200_000 * 60 = 132_000_000
      for (const s of scenarios) {
        expect(s.totalContributed.amount).toBe(132_000_000);
      }
    });
  });

  it('empty transactions → all series zero, all milestones zero, totalContributed zero', () => {
    const input: ProjectionInput = {
      transactions: [],
      ratio: 0.40,
      displayCurrency: 'VND',
      fx: FX,
    };
    const { scenarios } = computeProjection(input);
    for (const s of scenarios) {
      expect(s.series.every((p) => p.portfolioValue.amount === 0)).toBe(true);
      expect(s.milestones.yr10.amount).toBe(0);
      expect(s.milestones.yr20.amount).toBe(0);
      expect(s.milestones.yr30.amount).toBe(0);
      expect(s.totalContributed.amount).toBe(0);
    }
  });

  it('all negative net flow months → identical to empty-transactions projection', () => {
    const input: ProjectionInput = {
      transactions: [
        makeIncome(1_000_000, '2026-01'),
        makeExpense(5_000_000, '2026-01'),
      ],
      ratio: 0.40,
      displayCurrency: 'VND',
      fx: FX,
    };
    const emptyInput: ProjectionInput = { transactions: [], ratio: 0.40, displayCurrency: 'VND', fx: FX };

    const result = computeProjection(input);
    const emptyResult = computeProjection(emptyInput);

    for (let i = 0; i < 3; i++) {
      expect(result.scenarios[i].series[60].portfolioValue.amount).toBe(
        emptyResult.scenarios[i].series[60].portfolioValue.amount,
      );
      expect(result.scenarios[i].milestones.yr30.amount).toBe(0);
      expect(result.scenarios[i].totalContributed.amount).toBe(0);
    }
  });

  it('series length is 361 for all three scenarios (months 0..360 inclusive)', () => {
    const { scenarios } = computeProjection(WORKED_INPUT);
    expect(scenarios).toHaveLength(3);
    for (const s of scenarios) {
      expect(s.series).toHaveLength(361);
      expect(s.series[0].monthIndex).toBe(0);
      expect(s.series[360].monthIndex).toBe(360);
    }
  });

  it('scenarios.length === 3, in order [0.15, 0.175, 0.20]', () => {
    const { scenarios } = computeProjection(WORKED_INPUT);
    expect(scenarios).toHaveLength(3);
    expect(scenarios[0].annualRate).toBe(0.15);
    expect(scenarios[1].annualRate).toBe(0.175);
    expect(scenarios[2].annualRate).toBe(0.20);
  });

  it('ratio clamping: ratio 0.99 produces same result as ratio 0.50', () => {
    const base: Omit<ProjectionInput, 'ratio'> = {
      transactions: workedExampleTransactions(),
      displayCurrency: 'VND',
      fx: FX,
    };
    const high = computeProjection({ ...base, ratio: 0.99 });
    const max = computeProjection({ ...base, ratio: 0.50 });
    expect(high.scenarios[1].milestones.yr30.amount).toBe(
      max.scenarios[1].milestones.yr30.amount,
    );
  });

  it('ratio clamping: ratio 0.10 produces same result as ratio 0.30', () => {
    const base: Omit<ProjectionInput, 'ratio'> = {
      transactions: workedExampleTransactions(),
      displayCurrency: 'VND',
      fx: FX,
    };
    const low = computeProjection({ ...base, ratio: 0.10 });
    const min = computeProjection({ ...base, ratio: 0.30 });
    expect(low.scenarios[1].milestones.yr30.amount).toBe(
      min.scenarios[1].milestones.yr30.amount,
    );
  });

  it('determinism: two calls with identical input produce deep-equal output', () => {
    const a = computeProjection(WORKED_INPUT);
    const b = computeProjection(WORKED_INPUT);
    expect(a).toEqual(b);
  });

  it.skip('performance smoke: < 50ms for 12-month data, three scenarios, 360 months', () => {
    const input: ProjectionInput = {
      transactions: Array.from({ length: 12 }, (_, i) => {
        const month = String(i + 1).padStart(2, '0');
        return makeIncome(5_000_000, `2026-${month}`);
      }),
      ratio: 0.40,
      displayCurrency: 'VND',
      fx: FX,
    };
    const start = performance.now();
    computeProjection(input);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
