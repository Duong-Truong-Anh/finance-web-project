export const ANNUAL_RATES = [0.15, 0.175, 0.20] as const;

export function monthlyRateFromAnnual(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}
