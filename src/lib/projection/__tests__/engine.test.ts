import { describe, it, expect } from 'vitest';
import { runProjection } from '../engine';
import type { ProjectionInputs } from '../engine';
import type { InvestmentPlan, StockDefinition } from '../../transactions/types';

const STOCKS: StockDefinition[] = [
  { ticker: 'FPT',  name: 'FPT Corporation',   mu: 0.18, sigma: 0.28, isUserOverridden: false },
  { ticker: 'VIC',  name: 'Vingroup',           mu: 0.15, sigma: 0.35, isUserOverridden: false },
  { ticker: 'VOO',  name: 'Vanguard S&P 500',   mu: 0.10, sigma: 0.15, isUserOverridden: false },
  { ticker: 'NVDA', name: 'NVIDIA',             mu: 0.20, sigma: 0.45, isUserOverridden: false },
  { ticker: 'MSFT', name: 'Microsoft',          mu: 0.17, sigma: 0.25, isUserOverridden: false },
];

function makePlan(overrides: Partial<InvestmentPlan> = {}): InvestmentPlan {
  return {
    ratio: 0.40,
    durationYears: 5,
    projectionHorizonYears: 30,
    seed: 'test-seed-2026',
    ...overrides,
  };
}

function makeInputs(overrides: Partial<ProjectionInputs> = {}): ProjectionInputs {
  return {
    plan: makePlan(),
    stocks: STOCKS,
    monthlyFlows: [{ month: '2026-01', netCashFlow: 10_000_000 }],
    ...overrides,
  };
}

describe('runProjection', () => {
  // ─── Determinism ──────────────────────────────────────────────────────────

  it('produces identical results for the same inputs and seed', () => {
    const inputs = makeInputs();
    const r1 = runProjection(inputs);
    const r2 = runProjection(inputs);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  it('produces different month[11].totalValue for different seeds', () => {
    const r1 = runProjection(makeInputs({ plan: makePlan({ seed: 'seed-alpha' }) }));
    const r2 = runProjection(makeInputs({ plan: makePlan({ seed: 'seed-zeta-9999' }) }));
    // Collision probability is astronomically low with seeds this different.
    expect(r1.months[11]!.totalValue).not.toBe(r2.months[11]!.totalValue);
  });

  // ─── Output shape ─────────────────────────────────────────────────────────

  it('returns exactly 360 monthly snapshots', () => {
    const { months } = runProjection(makeInputs());
    expect(months).toHaveLength(360);
    expect(months[0]!.monthIndex).toBe(1);
    expect(months[359]!.monthIndex).toBe(360);
  });

  it('returns exactly 3 milestones at years 10, 20, 30', () => {
    const { milestones } = runProjection(makeInputs());
    expect(milestones).toHaveLength(3);
    expect(milestones.map((m) => m.year)).toEqual([10, 20, 30]);
  });

  // ─── Zero ratio ───────────────────────────────────────────────────────────

  it('produces zero contribution and zero portfolio for ratio = 0', () => {
    const { months } = runProjection(makeInputs({ plan: makePlan({ ratio: 0 }) }));
    for (const snap of months) {
      expect(snap.contribution).toBe(0);
      expect(snap.totalValue).toBe(0);
    }
  });

  // ─── Negative flow month ──────────────────────────────────────────────────

  it('sets contribution to 0 for a negative net flow month but compounds existing holdings', async () => {
    const flows = [
      { month: '2026-01', netCashFlow: 10_000_000 }, // positive → contributes
      { month: '2026-02', netCashFlow: -500_000 },   // negative → no contribution
    ];
    const { months } = runProjection(makeInputs({ monthlyFlows: flows }));

    // Month 2 contributed nothing.
    expect(months[1]!.contribution).toBe(0);

    // But the portfolio from month 1 should still have grown — totalValue > 0.
    expect(months[1]!.totalValue).toBeGreaterThan(0);
  });

  // ─── Contribution window ──────────────────────────────────────────────────

  it('stops contributions after durationYears and continues compounding', () => {
    const { months } = runProjection(
      makeInputs({
        plan: makePlan({ durationYears: 1 }),
        monthlyFlows: Array.from({ length: 12 }, (_, i) => ({
          month: `2026-${String(i + 1).padStart(2, '0')}`,
          netCashFlow: 5_000_000,
        })),
        expectedMonthlyNetFlow: 5_000_000,
      }),
    );

    // Months 1–12: contribution > 0 (positive flow, within window).
    for (let i = 0; i < 12; i++) {
      expect(months[i]!.contribution).toBeGreaterThan(0);
    }

    // Months 13–360: no contribution.
    for (let i = 12; i < 360; i++) {
      expect(months[i]!.contribution).toBe(0);
    }

    // The portfolio in month 360 should be larger than month 12 — it kept compounding.
    expect(months[359]!.totalValue).toBeGreaterThan(months[11]!.totalValue);
  });

  // ─── Ratio = 100% ─────────────────────────────────────────────────────────

  it('invests the full net flow at ratio = 1.0 (within per-stock rounding)', () => {
    const netFlow = 10_000_000;
    const { months } = runProjection(
      makeInputs({
        plan: makePlan({ ratio: 1.0 }),
        monthlyFlows: [{ month: '2026-01', netCashFlow: netFlow }],
      }),
    );
    // contribution = perStock * 5 where perStock = round(netFlow / 5)
    const expectedContribution = Math.round(netFlow / 5) * 5;
    expect(months[0]!.contribution).toBe(expectedContribution);
  });

  // ─── Milestones match months ──────────────────────────────────────────────

  it('milestone values match the corresponding monthly snapshots', () => {
    const { months, milestones } = runProjection(makeInputs());
    // year 10 = month 120 → index 119
    expect(milestones[0]!.totalValue).toBe(months[119]!.totalValue);
    expect(milestones[0]!.cumulativeContributions).toBe(months[119]!.cumulativeContributions);
    // year 20 = month 240 → index 239
    expect(milestones[1]!.totalValue).toBe(months[239]!.totalValue);
    // year 30 = month 360 → index 359
    expect(milestones[2]!.totalValue).toBe(months[359]!.totalValue);
  });

  // ─── Gains crossover ──────────────────────────────────────────────────────

  it('reports gainsExceedContributionsAtMonth as the first month where gains > contributions', () => {
    const { months, gainsExceedContributionsAtMonth } = runProjection(makeInputs());

    if (gainsExceedContributionsAtMonth !== null) {
      const crossover = gainsExceedContributionsAtMonth;
      // At the crossover month, gains > contributions.
      const snap = months[crossover - 1]!;
      expect(snap.cumulativeGains).toBeGreaterThan(snap.cumulativeContributions);
      // The month before the crossover should not have crossed (if crossover > 1).
      if (crossover > 1) {
        const prev = months[crossover - 2]!;
        expect(prev.cumulativeGains).toBeLessThanOrEqual(prev.cumulativeContributions);
      }
    }
    // null is valid if gains never exceed contributions — no assertion needed.
  });
});
