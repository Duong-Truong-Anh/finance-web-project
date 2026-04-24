import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import { lognormalMonthlyReturn } from '../returns';

describe('createRng', () => {
  describe('nextFloat — determinism', () => {
    it('produces the same sequence of 1000 draws for the same seed', () => {
      const rng1 = createRng('flowstate-seed-abc');
      const rng2 = createRng('flowstate-seed-abc');
      for (let i = 0; i < 1000; i++) {
        expect(rng1.nextFloat()).toBe(rng2.nextFloat());
      }
    });

    it('produces different first values for different seeds', () => {
      const v1 = createRng('seed-alpha').nextFloat();
      const v2 = createRng('seed-beta').nextFloat();
      expect(v1).not.toBe(v2);
    });
  });

  describe('nextNormal — Box-Muller statistical validity', () => {
    it('produces 10,000 draws with mean ≈ 0 and std ≈ 1', () => {
      const N = 10_000;
      const rng = createRng('stat-normal-test');
      const draws: number[] = [];
      for (let i = 0; i < N; i++) {
        draws.push(rng.nextNormal());
      }
      const mean = draws.reduce((a, b) => a + b, 0) / N;
      const variance = draws.reduce((s, v) => s + (v - mean) ** 2, 0) / N;
      const std = Math.sqrt(variance);

      expect(Math.abs(mean)).toBeLessThan(0.05);
      expect(std).toBeGreaterThan(0.97);
      expect(std).toBeLessThan(1.03);
    });

    it('is deterministic — same seed produces same normal sequence', () => {
      const rng1 = createRng('normal-det-test');
      const rng2 = createRng('normal-det-test');
      for (let i = 0; i < 500; i++) {
        expect(rng1.nextNormal()).toBe(rng2.nextNormal());
      }
    });
  });
});

describe('lognormalMonthlyReturn', () => {
  // Statistical validation of the Itô correction.
  // For N draws: ln(1+r) should be normally distributed with
  //   mean ≈ μ/12 − σ²/24
  //   std  ≈ σ/√12
  // Tolerances are ~3 SE at N=10,000.
  it('produces log-returns with the correct mean and std (Itô correction)', () => {
    const mu = 0.12;
    const sigma = 0.20;
    const N = 10_000;
    const rng = createRng('ito-correction-test');
    const logReturns: number[] = [];

    for (let i = 0; i < N; i++) {
      const Z = rng.nextNormal();
      const r = lognormalMonthlyReturn(mu, sigma, Z);
      logReturns.push(Math.log(1 + r));
    }

    const mean = logReturns.reduce((a, b) => a + b, 0) / N;
    const variance = logReturns.reduce((s, v) => s + (v - mean) ** 2, 0) / N;
    const std = Math.sqrt(variance);

    const expectedMean = mu / 12 - (sigma * sigma) / 24;
    const expectedStd = sigma / Math.sqrt(12);

    console.log(
      `[Itô] log-return mean: ${mean.toFixed(6)} (expected ${expectedMean.toFixed(6)}, Δ ${(mean - expectedMean).toFixed(6)})`,
    );
    console.log(
      `[Itô] log-return std:  ${std.toFixed(6)} (expected ${expectedStd.toFixed(6)}, Δ ${(std - expectedStd).toFixed(6)})`,
    );

    expect(Math.abs(mean - expectedMean)).toBeLessThan(0.002);
    expect(Math.abs(std - expectedStd)).toBeLessThan(0.003);
  });
});
