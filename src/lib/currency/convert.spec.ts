import { describe, it, expect } from 'vitest';
import { convert, FxUnsupportedPairError } from './convert';
import type { FxRateSnapshot } from './types';

const FX: FxRateSnapshot = {
  base: 'USD',
  rates: { VND: 25_000, USD: 1 },
  fetchedAt: '2026-04-30T00:00:00Z',
};

describe('convert', () => {
  describe('identity', () => {
    it('VND → VND returns the same object', () => {
      const money = { amount: 50_000_000, currency: 'VND' as const };
      expect(convert(money, 'VND', FX)).toBe(money);
    });

    it('USD → USD returns the same object', () => {
      const money = { amount: 200_000, currency: 'USD' as const };
      expect(convert(money, 'USD', FX)).toBe(money);
    });
  });

  describe('VND → USD', () => {
    it('converts 50,000,000 đồng to 200,000 cents at 25,000 VND/USD', () => {
      // 50,000,000 / 25,000 = 2,000 USD = 200,000 cents
      expect(convert({ amount: 50_000_000, currency: 'VND' }, 'USD', FX)).toEqual({
        amount: 200_000,
        currency: 'USD',
      });
    });

    it('rounds zero to zero cents', () => {
      expect(convert({ amount: 0, currency: 'VND' }, 'USD', FX)).toEqual({
        amount: 0,
        currency: 'USD',
      });
    });

    it('sub-cent amount (1 đồng) rounds down to 0 cents', () => {
      // 1 / 25,000 * 100 = 0.004 → rounds to 0
      expect(convert({ amount: 1, currency: 'VND' }, 'USD', FX)).toEqual({
        amount: 0,
        currency: 'USD',
      });
    });

    it('rounds half-to-even: 125 đồng → 0 cents (0.5 rounds to even 0)', () => {
      // 125 / 25,000 * 100 = 0.5 → banker's rounds to 0 (0 is even)
      expect(convert({ amount: 125, currency: 'VND' }, 'USD', FX)).toEqual({
        amount: 0,
        currency: 'USD',
      });
    });

    it('rounds half-to-even: 375 đồng → 2 cents (1.5 rounds to even 2)', () => {
      // 375 / 25,000 * 100 = 1.5 → banker's rounds to 2 (2 is even)
      expect(convert({ amount: 375, currency: 'VND' }, 'USD', FX)).toEqual({
        amount: 2,
        currency: 'USD',
      });
    });
  });

  describe('USD → VND', () => {
    it('converts 200,000 cents to 50,000,000 đồng at 25,000 VND/USD', () => {
      // 200,000 * 25,000 / 100 = 50,000,000
      expect(convert({ amount: 200_000, currency: 'USD' }, 'VND', FX)).toEqual({
        amount: 50_000_000,
        currency: 'VND',
      });
    });

    it('rounds zero to zero đồng', () => {
      expect(convert({ amount: 0, currency: 'USD' }, 'VND', FX)).toEqual({
        amount: 0,
        currency: 'VND',
      });
    });
  });

  describe('unsupported pair', () => {
    it('throws FxUnsupportedPairError for an unrecognised pair', () => {
      // Force an unsupported direction via type cast to test the guard
      expect(() =>
        convert(
          { amount: 100, currency: 'VND' },
          'VND' as 'USD', // triggers the else branch only if currency === toCurrency were patched
          FX,
        ),
      ).not.toThrow(); // identity short-circuit catches this

      // Genuine unsupported: inject a fabricated currency via cast
      const badMoney = { amount: 100, currency: 'EUR' as 'USD' };
      expect(() => convert(badMoney, 'VND', FX)).toThrow(FxUnsupportedPairError);
    });
  });
});
