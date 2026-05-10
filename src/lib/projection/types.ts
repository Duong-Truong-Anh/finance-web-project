import type { Currency, FxRateSnapshot, Money, YearMonth } from '../currency/types';
import type { Transaction } from '../transactions/schema';
import type { AssetClass, AssetAllocation } from '../portfolio/schema';

export type ProjectionInput = {
  transactions: Transaction[];
  allocation: AssetAllocation;
  displayCurrency: Currency;
  fx: FxRateSnapshot;
};

export type MonthlyAggregate = {
  yearMonth: YearMonth;
  inflow: Money;
  outflow: Money;
  netFlow: Money;
  byAsset: Record<AssetClass, Money>;
  perStockInvestment: Money;
};

export type ProjectionPoint = {
  monthIndex: number; // 0..360
  value: Money;       // renamed from portfolioValue (Phase 3.1)
};

export type AssetMilestones = {
  yr10: Money; // month 120
  yr20: Money; // month 240
  yr30: Money; // month 360
};

export type AssetSeries = {
  series: ProjectionPoint[];    // Length 361
  milestones: AssetMilestones;
  totalContributed: Money;      // sum across months 1..60 for this asset
};

export type ProjectionScenario = {
  variant: 'low' | 'mid' | 'high';
  annualStockRate: 0.15 | 0.175 | 0.20;
  series: ProjectionPoint[];              // Total portfolio (sum of all 5 assets), length 361
  milestones: AssetMilestones;            // Total portfolio milestones
  totalContributed: Money;               // Sum of contributions across all 5 assets
  byAsset: Record<AssetClass, AssetSeries>;
};

export type Projection = {
  scenarios: ProjectionScenario[]; // Length 3: [low, mid, high]
  contributionMonths: 60;
  totalMonths: 360;
};
