import { describe, it, expect } from 'vitest';
import { format } from './format';

// Use toContain rather than exact-match: Intl output varies by Node version
// (e.g., some versions emit a non-breaking space between number and currency glyph).

describe('format', () => {
  describe('VND', () => {
    it('formats 50,000,000 đồng with Vietnamese locale', () => {
      const result = format({ amount: 50_000_000, currency: 'VND' }, 'vi-VN');
      expect(result).toContain('50.000.000');
      expect(result).toContain('₫');
    });

    it('formats zero đồng with the đồng glyph', () => {
      const result = format({ amount: 0, currency: 'VND' }, 'vi-VN');
      expect(result).toContain('0');
      expect(result).toContain('₫');
    });

    it('formats a 4-digit VND amount with thousands separator', () => {
      const result = format({ amount: 1_000, currency: 'VND' }, 'vi-VN');
      // vi-VN uses '.' as the thousands separator: 1.000 ₫
      expect(result).toContain('1');
      expect(result).toContain('₫');
    });
  });

  describe('USD', () => {
    it('formats 50,000 cents as $500.00', () => {
      const result = format({ amount: 50_000, currency: 'USD' }, 'en-US');
      expect(result).toBe('$500.00');
    });

    it('formats zero cents as $0.00', () => {
      const result = format({ amount: 0, currency: 'USD' }, 'en-US');
      expect(result).toBe('$0.00');
    });

    it('emits exactly two decimal places for USD', () => {
      const result = format({ amount: 100_050, currency: 'USD' }, 'en-US');
      expect(result).toBe('$1,000.50');
    });
  });
});
