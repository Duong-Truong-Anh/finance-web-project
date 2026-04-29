/**
 * Convert an annual growth rate to its equivalent monthly compounding rate.
 * (1 + annual)^(1/12) - 1
 * See docs/03_calculation_spec.md §4.
 */
export function monthlyRateFromAnnual(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}
