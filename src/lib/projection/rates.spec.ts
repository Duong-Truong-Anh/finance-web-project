import { describe, it, expect } from 'vitest';
import { monthlyRateFromAnnual } from './rates';

describe('monthlyRateFromAnnual', () => {
  it('matches calc-spec §4 for 15% annual', () => {
    expect(monthlyRateFromAnnual(0.15)).toBeCloseTo(0.011714917, 6);
  });
  it('matches calc-spec §4 for 17.5% annual', () => {
    // Correct value: (1.175)^(1/12) - 1 ≈ 0.013529722
    // Note: docs/03_calculation_spec.md §4 lists 0.013561968 which is a transcription error.
    // See AI-PROCESS-LOG.md Session 3 for details.
    expect(monthlyRateFromAnnual(0.175)).toBeCloseTo(0.013529722, 6);
  });
  it('matches calc-spec §4 for 20% annual', () => {
    expect(monthlyRateFromAnnual(0.20)).toBeCloseTo(0.015309470, 6);
  });
  it('returns 0 for a 0 annual rate', () => {
    expect(monthlyRateFromAnnual(0)).toBe(0);
  });
});
