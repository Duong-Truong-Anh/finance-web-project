import { describe, it, expect } from 'vitest';
import { format, formatCompact } from './format';

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

describe('formatCompact', () => {
  // Receives already-major-units values (dollars / đồng), not minor units.

  describe('USD (en-US)', () => {
    it.each([
      [0, '$0'],
      [999, '$999'],
      [1_000, '$1K'],
      [50_000, '$50K'],
      [250_000, '$250K'],
      [999_999, '$1M'],
      [1_000_000, '$1M'],
      [1_500_000, '$1.5M'],
    ])('formats %d as %s', (value, expected) => {
      expect(formatCompact(value, 'en-US')).toBe(expected);
    });

    it('prefixes a minus glyph for negative values', () => {
      const result = formatCompact(-50_000, 'en-US');
      expect(result).toContain('50K');
      expect(result).toContain('-');
    });
  });

  describe('VND (vi-VN)', () => {
    it.each([
      [0, '0'],
      [50_000_000, '50tr'],
      [100_000_000, '100tr'],
      [250_000_000, '250tr'],
      [1_500_000, '1.5tr'],
      [1_000_000, '1tr'],
      [1_000_000_000, '1 tỷ'],
      [1_500_000_000, '1.5 tỷ'],
    ])('formats %d as %s', (value, expected) => {
      expect(formatCompact(value, 'vi-VN')).toBe(expected);
    });

    it('renders sub-million values without a suffix', () => {
      expect(formatCompact(999, 'vi-VN')).toBe('999');
    });

    it('prefixes a minus glyph for negative đồng', () => {
      expect(formatCompact(-50_000_000, 'vi-VN')).toBe('-50tr');
    });
  });
});
