import type { Currency, Money } from '../currency/types';
import { ANNUAL_RATES, monthlyRateFromAnnual } from './rates';
import { aggregateMonthlyInvestments } from './monthly-investments';
import type { Projection, ProjectionInput, ProjectionScenario } from './types';

// Banker's rounding (half-to-even). Keeps loop value as float; rounds only when storing Money.
function roundHalfToEven(n: number): number {
  const floor = Math.floor(n);
  const diff = n - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildScenario(
  g: 0.15 | 0.175 | 0.20,
  contributions: Money[],
  currency: Currency,
): ProjectionScenario {
  const gm = monthlyRateFromAnnual(g);
  const series = [{ monthIndex: 0, portfolioValue: { amount: 0, currency } }];
  let value = 0;

  for (let m = 1; m <= 360; m++) {
    if (m <= 60) {
      value = (value + contributions[m - 1].amount) * (1 + gm);
    } else {
      value = value * (1 + gm);
    }
    series.push({ monthIndex: m, portfolioValue: { amount: roundHalfToEven(value), currency } });
  }

  const totalContributedAmount = contributions.reduce((sum, c) => sum + c.amount, 0);

  return {
    annualRate: g,
    series,
    milestones: {
      yr10: series[120].portfolioValue,
      yr20: series[240].portfolioValue,
      yr30: series[360].portfolioValue,
    },
    totalContributed: { amount: totalContributedAmount, currency },
  };
}

export function computeProjection(input: ProjectionInput): Projection {
  const ratio = clamp(input.ratio, 0.30, 0.50);
  const contributions = aggregateMonthlyInvestments(
    input.transactions,
    ratio,
    input.displayCurrency,
    input.fx,
  );

  const scenarios = ANNUAL_RATES.map((g) =>
    buildScenario(g, contributions, input.displayCurrency),
  );

  return { scenarios, contributionMonths: 60, totalMonths: 360 };
}
