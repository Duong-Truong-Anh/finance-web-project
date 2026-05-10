import type { Currency, Money } from '../currency/types';
import { ANNUAL_RATES, ASSET_RATES, monthlyRateFromAnnual } from './rates';
import { aggregateMonthlyContributions } from './monthly-investments';
import { ASSET_CLASSES } from '../portfolio/schema';
import type { AssetClass } from '../portfolio/schema';
import type {
  Projection,
  ProjectionInput,
  ProjectionScenario,
  ProjectionPoint,
  AssetSeries,
} from './types';

const VARIANTS = ['low', 'mid', 'high'] as const;

// Banker's rounding (half-to-even). Keeps running value as float; rounds only when storing Money.
function roundHalfToEven(n: number): number {
  const floor = Math.floor(n);
  const diff = n - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}

function buildAssetSeries(
  contributions: Money[],
  annualRate: number,
  currency: Currency,
): AssetSeries {
  const gm = monthlyRateFromAnnual(annualRate);
  const series: ProjectionPoint[] = [{ monthIndex: 0, value: { amount: 0, currency } }];
  let value = 0;

  for (let m = 1; m <= 360; m++) {
    if (m <= 60) {
      value = (value + contributions[m - 1].amount) * (1 + gm);
    } else {
      value = value * (1 + gm);
    }
    series.push({ monthIndex: m, value: { amount: roundHalfToEven(value), currency } });
  }

  const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);

  return {
    series,
    milestones: {
      yr10: series[120].value,
      yr20: series[240].value,
      yr30: series[360].value,
    },
    totalContributed: { amount: totalContributed, currency },
  };
}

function buildScenario(
  stockRate: 0.15 | 0.175 | 0.20,
  variant: 'low' | 'mid' | 'high',
  byAssetContributions: Record<AssetClass, Money[]>,
  currency: Currency,
): ProjectionScenario {
  const byAsset = {} as Record<AssetClass, AssetSeries>;

  for (const asset of ASSET_CLASSES) {
    const rate = asset === 'stocks' ? stockRate : ASSET_RATES[asset];
    byAsset[asset] = buildAssetSeries(byAssetContributions[asset], rate, currency);
  }

  // Total portfolio: sum across all 5 assets at each month index
  const series: ProjectionPoint[] = Array.from({ length: 361 }, (_, k) => ({
    monthIndex: k,
    value: {
      amount: ASSET_CLASSES.reduce((sum, a) => sum + byAsset[a].series[k].value.amount, 0),
      currency,
    },
  }));

  const totalContributed = ASSET_CLASSES.reduce(
    (sum, a) => sum + byAsset[a].totalContributed.amount,
    0,
  );

  return {
    variant,
    annualStockRate: stockRate,
    series,
    milestones: {
      yr10: series[120].value,
      yr20: series[240].value,
      yr30: series[360].value,
    },
    totalContributed: { amount: totalContributed, currency },
    byAsset,
  };
}

export function computeProjection(input: ProjectionInput): Projection {
  const byAssetContributions = aggregateMonthlyContributions(
    input.transactions,
    input.allocation,
    input.displayCurrency,
    input.fx,
  );

  const scenarios = ANNUAL_RATES.map((g, i) =>
    buildScenario(g, VARIANTS[i], byAssetContributions, input.displayCurrency),
  );

  return { scenarios, contributionMonths: 60, totalMonths: 360 };
}
