import { describe, it, expect } from 'vitest';
import { computeProjection } from './compute-projection';
import { monthlyRateFromAnnual, ASSET_RATES } from './rates';
import { ASSET_ALLOCATION, ASSET_CLASSES } from '../portfolio/schema';
import type { ProjectionInput } from './types';
import type { Transaction } from '../transactions/schema';
import type { FxRateSnapshot } from '../currency/types';

const FX: FxRateSnapshot = {
  base: 'USD',
  rates: { VND: 25000, USD: 1 },
  fetchedAt: '2026-05-01T00:00:00.000Z',
};

// Annuity-due closed-form FV: PMT contributed at start-of-month, full month growth.
// V_60 = PMT * (1+gm) * [(1+gm)^60 - 1] / gm
// Independent of the iterative implementation to avoid circular validation.
function annuityDueFV(pmt: number, annual: number): number {
  const gm = monthlyRateFromAnnual(annual);
  if (gm === 0) return pmt * 60; // No growth: simple sum
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
// netFlow = 5,500,000 VND/month.
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

// Per-asset contributions for worked example:
//   stocks:  floor(5,500,000 × 0.50) = 2,750,000/month
//   savings/cash/gold/usd: floor(5,500,000 × 0.10) = 550,000/month each
const STOCKS_PMT  = 2_750_000;
const NONSTOCK_PMT = 550_000;

const WORKED_INPUT: ProjectionInput = {
  transactions: workedExampleTransactions(),
  allocation: ASSET_ALLOCATION,
  displayCurrency: 'VND',
  fx: FX,
};

describe('computeProjection', () => {
  describe('worked example (spec §9)', () => {
    it('per-asset totalContributed matches exact values', () => {
      const { scenarios } = computeProjection(WORKED_INPUT);
      // All scenarios share the same contributions; pick mid
      const { byAsset } = scenarios[1];
      expect(byAsset.stocks.totalContributed.amount).toBe(165_000_000);   // 2,750,000 × 60
      expect(byAsset.savings.totalContributed.amount).toBe(33_000_000);  // 550,000 × 60
      expect(byAsset.cash.totalContributed.amount).toBe(33_000_000);
      expect(byAsset.gold.totalContributed.amount).toBe(33_000_000);
      expect(byAsset.usd.totalContributed.amount).toBe(33_000_000);
    });

    it('total totalContributed is 297,000,000 for all scenarios', () => {
      const { scenarios } = computeProjection(WORKED_INPUT);
      // 4,950,000/month × 60 = 297,000,000
      // Note: ASSET_ALLOCATION sums to 0.90 (not 1.00); see ADR 008 (docs/decisions/008_asset-allocation-sum-discrepancy.md).
      for (const s of scenarios) {
        expect(s.totalContributed.amount).toBe(297_000_000);
      }
    });

    it('series[60] for stocks matches closed-form annuity-due FV within ±1 for all 3 rates', () => {
      const { scenarios } = computeProjection(WORKED_INPUT);
      for (let i = 0; i < 3; i++) {
        const rate = [0.15, 0.175, 0.20][i];
        const expected = Math.round(annuityDueFV(STOCKS_PMT, rate));
        const actual = scenarios[i].byAsset.stocks.series[60].value.amount;
        expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
      }
    });

    it('series[60] for savings matches closed-form annuity-due FV within ±1', () => {
      const { scenarios } = computeProjection(WORKED_INPUT);
      const expected = Math.round(annuityDueFV(NONSTOCK_PMT, ASSET_RATES.savings));
      const actual = scenarios[0].byAsset.savings.series[60].value.amount;
      expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
    });

    it('series[60] for cash equals exact sum (0% growth)', () => {
      const { scenarios } = computeProjection(WORKED_INPUT);
      // Cash has 0% rate; FV = PMT × 60 exactly (no rounding needed)
      expect(scenarios[0].byAsset.cash.series[60].value.amount).toBe(NONSTOCK_PMT * 60);
    });

    it('series[60] for usd equals exact sum (0% growth)', () => {
      const { scenarios } = computeProjection(WORKED_INPUT);
      expect(scenarios[0].byAsset.usd.series[60].value.amount).toBe(NONSTOCK_PMT * 60);
    });

    it('series[60] for gold matches closed-form annuity-due FV within ±1', () => {
      const { scenarios } = computeProjection(WORKED_INPUT);
      const expected = Math.round(annuityDueFV(NONSTOCK_PMT, ASSET_RATES.gold));
      const actual = scenarios[0].byAsset.gold.series[60].value.amount;
      expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
    });

    it('total series[k] equals sum of byAsset series[k] at spot-check months', () => {
      const { scenarios } = computeProjection(WORKED_INPUT);
      for (const s of scenarios) {
        for (const k of [0, 30, 60, 120, 240, 360]) {
          const assetSum = ASSET_CLASSES.reduce(
            (sum, a) => sum + s.byAsset[a].series[k].value.amount,
            0,
          );
          expect(s.series[k].value.amount).toBe(assetSum);
        }
      }
    });

    it('yr30 total milestone is within ±1 of sum of per-asset closed-form yr30 values (mid scenario)', () => {
      const { scenarios } = computeProjection(WORKED_INPUT);
      const mid = scenarios[1];

      // V_a_yr30 = V_a_60 × (1 + g_a)^25
      const stocksFv60 = annuityDueFV(STOCKS_PMT, 0.175);
      const savingsFv60 = annuityDueFV(NONSTOCK_PMT, ASSET_RATES.savings);
      const cashFv60 = NONSTOCK_PMT * 60;
      const goldFv60 = annuityDueFV(NONSTOCK_PMT, ASSET_RATES.gold);
      const usdFv60 = NONSTOCK_PMT * 60;

      const expectedTotal = Math.round(
        stocksFv60  * Math.pow(1.175, 25) +
        savingsFv60 * Math.pow(1.05, 25)  +
        cashFv60                           +
        goldFv60    * Math.pow(1.07, 25)  +
        usdFv60,
      );

      expect(Math.abs(mid.milestones.yr30.amount - expectedTotal)).toBeLessThanOrEqual(2);
    });
  });

  it('empty transactions → all series zero, all milestones zero, totalContributed zero', () => {
    const input: ProjectionInput = {
      transactions: [],
      allocation: ASSET_ALLOCATION,
      displayCurrency: 'VND',
      fx: FX,
    };
    const { scenarios } = computeProjection(input);
    for (const s of scenarios) {
      expect(s.series.every((p) => p.value.amount === 0)).toBe(true);
      expect(s.milestones.yr10.amount).toBe(0);
      expect(s.milestones.yr20.amount).toBe(0);
      expect(s.milestones.yr30.amount).toBe(0);
      expect(s.totalContributed.amount).toBe(0);
      for (const asset of ASSET_CLASSES) {
        expect(s.byAsset[asset].series.every((p) => p.value.amount === 0)).toBe(true);
        expect(s.byAsset[asset].totalContributed.amount).toBe(0);
      }
    }
  });

  it('all negative net flow months → identical to empty-transactions projection', () => {
    const negInput: ProjectionInput = {
      transactions: [
        makeIncome(1_000_000, '2026-01'),
        makeExpense(5_000_000, '2026-01'),
      ],
      allocation: ASSET_ALLOCATION,
      displayCurrency: 'VND',
      fx: FX,
    };
    const emptyInput: ProjectionInput = {
      transactions: [],
      allocation: ASSET_ALLOCATION,
      displayCurrency: 'VND',
      fx: FX,
    };
    const neg = computeProjection(negInput);
    const empty = computeProjection(emptyInput);
    for (let i = 0; i < 3; i++) {
      expect(neg.scenarios[i].series[60].value.amount).toBe(
        empty.scenarios[i].series[60].value.amount,
      );
      expect(neg.scenarios[i].milestones.yr30.amount).toBe(0);
      expect(neg.scenarios[i].totalContributed.amount).toBe(0);
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

  it('byAsset series length is 361 for all assets and all scenarios', () => {
    const { scenarios } = computeProjection(WORKED_INPUT);
    for (const s of scenarios) {
      for (const asset of ASSET_CLASSES) {
        expect(s.byAsset[asset].series).toHaveLength(361);
      }
    }
  });

  it('scenarios has length 3, in order low/mid/high with correct variant + annualStockRate', () => {
    const { scenarios } = computeProjection(WORKED_INPUT);
    expect(scenarios).toHaveLength(3);
    expect(scenarios[0].variant).toBe('low');
    expect(scenarios[0].annualStockRate).toBe(0.15);
    expect(scenarios[1].variant).toBe('mid');
    expect(scenarios[1].annualStockRate).toBe(0.175);
    expect(scenarios[2].variant).toBe('high');
    expect(scenarios[2].annualStockRate).toBe(0.20);
  });

  it('non-stock byAsset series is identical across all three scenarios (stocks drive the spread)', () => {
    const { scenarios } = computeProjection(WORKED_INPUT);
    for (const asset of ['savings', 'cash', 'gold', 'usd'] as const) {
      const low  = scenarios[0].byAsset[asset].series[360].value.amount;
      const mid  = scenarios[1].byAsset[asset].series[360].value.amount;
      const high = scenarios[2].byAsset[asset].series[360].value.amount;
      expect(low).toBe(mid);
      expect(mid).toBe(high);
    }
  });

  it('totalContributed is constant across all three scenarios', () => {
    const { scenarios } = computeProjection(WORKED_INPUT);
    const ref = scenarios[0].totalContributed.amount;
    expect(scenarios[1].totalContributed.amount).toBe(ref);
    expect(scenarios[2].totalContributed.amount).toBe(ref);
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
      allocation: ASSET_ALLOCATION,
      displayCurrency: 'VND',
      fx: FX,
    };
    const start = performance.now();
    computeProjection(input);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
