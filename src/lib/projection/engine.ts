import type { InvestmentPlan, StockDefinition } from '../transactions/types';
import { createRng } from '../simulation/rng';
import { lognormalMonthlyReturn } from '../simulation/returns';

// ─── Input / output types ────────────────────────────────────────────────────

export interface MonthlyNetFlow {
  month: string;   // 'YYYY-MM' — used for labelling only; engine treats flows positionally
  netCashFlow: number; // integer, smallest currency unit. Negative → zero contribution.
}

export interface ProjectionInputs {
  plan: InvestmentPlan;           // ratio, durationYears, projectionHorizonYears (30), seed
  stocks: StockDefinition[];      // exactly 5
  monthlyFlows: MonthlyNetFlow[]; // historical data, ordered chronologically
  expectedMonthlyNetFlow?: number; // UI-supplied fallback when < 3 months of history
}

export interface MonthlySnapshot {
  monthIndex: number;             // 1..360
  totalValue: number;             // integer (rounded from internal float)
  stockValues: number[];          // integer per stock, parallel to inputs.stocks
  contribution: number;           // integer invested this month (0 if past window or netFlow ≤ 0)
  cumulativeContributions: number;
  cumulativeGains: number;        // totalValue − cumulativeContributions
}

export interface ProjectionMilestone {
  year: 10 | 20 | 30;
  totalValue: number;
  cumulativeContributions: number;
  cumulativeGains: number;
}

export interface ProjectionResult {
  months: MonthlySnapshot[];          // exactly 360 items
  milestones: ProjectionMilestone[];  // year 10, 20, 30 in that order
  gainsExceedContributionsAtMonth: number | null; // monthIndex of first crossover, or null
}

// ─── Engine ──────────────────────────────────────────────────────────────────

// Growth-then-contribute convention: each month, existing holdings grow first,
// then the new contribution is added. This is the standard "end-of-period"
// investment model.

export function runProjection(inputs: ProjectionInputs): ProjectionResult {
  const { plan, stocks, monthlyFlows, expectedMonthlyNetFlow } = inputs;

  // Determine fallback net flow for months beyond historical data.
  // Use average of positive historical flows when available; otherwise use the
  // UI-supplied fallback; otherwise zero.
  const positiveFlows = monthlyFlows.filter((f) => f.netCashFlow > 0);
  let fallbackNetFlow: number;
  if (positiveFlows.length > 0) {
    fallbackNetFlow = positiveFlows.reduce((s, f) => s + f.netCashFlow, 0) / positiveFlows.length;
  } else if (expectedMonthlyNetFlow !== undefined && expectedMonthlyNetFlow > 0) {
    fallbackNetFlow = expectedMonthlyNetFlow;
  } else {
    fallbackNetFlow = 0;
  }

  const rng = createRng(plan.seed);
  const durationMonths = plan.durationYears * 12;
  const totalMonths = plan.projectionHorizonYears * 12; // 360

  // Internal stock values as float64 to avoid compounding rounding errors.
  const stockValuesF = new Array<number>(stocks.length).fill(0);
  let cumulativeContributions = 0;

  const months: MonthlySnapshot[] = [];
  let gainsExceedContributionsAtMonth: number | null = null;

  for (let monthIndex = 1; monthIndex <= totalMonths; monthIndex++) {
    // 1. Apply lognormal growth to existing holdings.
    for (let s = 0; s < stocks.length; s++) {
      const Z = rng.nextNormal();
      const r = lognormalMonthlyReturn(stocks[s].mu, stocks[s].sigma, Z);
      stockValuesF[s] = stockValuesF[s] * (1 + r);
    }

    // 2. Add contribution if within the investment window.
    //    monthlyFlows are used positionally: index 0 = month 1 of projection.
    let contribution = 0;
    if (monthIndex <= durationMonths) {
      const flowEntry = monthlyFlows[monthIndex - 1];
      const netFlow = flowEntry !== undefined ? flowEntry.netCashFlow : fallbackNetFlow;

      if (netFlow > 0) {
        const totalContribution = Math.round(plan.ratio * netFlow);
        const perStock = Math.round(totalContribution / stocks.length);
        contribution = perStock * stocks.length;
        for (let s = 0; s < stocks.length; s++) {
          stockValuesF[s] += perStock;
        }
      }
    }

    cumulativeContributions += contribution;

    // 3. Round to integers for the snapshot.
    const stockValues = stockValuesF.map((v) => Math.round(v));
    const totalValue = stockValues.reduce((a, b) => a + b, 0);
    const cumulativeGains = totalValue - cumulativeContributions;

    if (gainsExceedContributionsAtMonth === null && cumulativeGains > cumulativeContributions) {
      gainsExceedContributionsAtMonth = monthIndex;
    }

    months.push({
      monthIndex,
      totalValue,
      stockValues,
      contribution,
      cumulativeContributions,
      cumulativeGains,
    });
  }

  const milestones: ProjectionMilestone[] = ([10, 20, 30] as const).map((year) => {
    const snapshot = months[year * 12 - 1]!;
    return {
      year,
      totalValue: snapshot.totalValue,
      cumulativeContributions: snapshot.cumulativeContributions,
      cumulativeGains: snapshot.cumulativeGains,
    };
  });

  return { months, milestones, gainsExceedContributionsAtMonth };
}
