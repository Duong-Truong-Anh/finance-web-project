import type { AssetClass } from '../portfolio/schema';

export const ANNUAL_RATES = [0.15, 0.175, 0.20] as const;

// Non-stock annual growth rates (single rate each, constant across all stock scenarios).
// Per docs/03_calculation_spec.md §1: defaults pending teacher's reference documents.
// Stocks use the per-scenario rate from ANNUAL_RATES; this record covers the other four.
export const ASSET_RATES: Record<Exclude<AssetClass, 'stocks'>, number> = {
  savings: 0.05,
  cash:    0.00,
  gold:    0.07,
  usd:     0.00,
};

// (1 + annual)^(1/12) − 1. See docs/03_calculation_spec.md §4.
export function monthlyRateFromAnnual(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}
