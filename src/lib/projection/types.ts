import type { Money, YearMonth } from '../currency/types';

export type MonthlyAggregate = {
  yearMonth: YearMonth;
  inflow: Money;
  outflow: Money;
  netFlow: Money;
  monthlyInvestment: Money;
  perStockInvestment: Money;
};

export type ProjectionPoint = {
  monthIndex: number; // 0..360
  portfolioValue: Money;
};

export type ProjectionScenario = {
  annualRate: 0.15 | 0.175 | 0.20;
  series: ProjectionPoint[]; // Length 361 (months 0..360)
  milestones: { yr10: Money; yr20: Money; yr30: Money };
  totalContributed: Money;
};

export type Projection = {
  scenarios: ProjectionScenario[]; // Length 3
  contributionMonths: 60;
  totalMonths: 360;
};
