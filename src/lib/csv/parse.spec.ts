import { describe, it, expect } from 'vitest';
import { parseCsv } from './parse';

const HEADER = 'date,kind,name,amount,currency,notes';

function row(
  date: string,
  kind: string,
  name: string,
  amount: string,
  currency: string,
  notes: string,
): string {
  return `${date},${kind},${name},${amount},${currency},${notes}`;
}

describe('parseCsv', () => {
  describe('header-only file', () => {
    it('returns empty valid and errors arrays', () => {
      const result = parseCsv(HEADER);
      expect(result.valid).toEqual([]);
      expect(result.errors).toEqual([]);
    });
  });

  describe('two valid rows', () => {
    it('returns both transactions in valid', () => {
      const csv = [
        HEADER,
        row('2026-04-01', 'income', 'Salary', '18000000', 'VND', ''),
        row('2026-04-05', 'expense', 'Rent', '5500000', 'VND', 'April rent'),
      ].join('\n');
      const result = parseCsv(csv);
      expect(result.errors).toEqual([]);
      expect(result.valid).toHaveLength(2);
      expect(result.valid[0].kind).toBe('income');
      expect(result.valid[0].amount).toEqual({ amount: 18_000_000, currency: 'VND' });
      expect(result.valid[0].notes).toBeNull();
      expect(result.valid[1].kind).toBe('expense');
      expect(result.valid[1].amount).toEqual({ amount: 5_500_000, currency: 'VND' });
      expect(result.valid[1].notes).toBe('April rent');
    });
  });

  describe('missing required header column', () => {
    it('returns single error at row 1 and empty valid when currency column absent', () => {
      const csv = 'date,kind,name,amount,notes\n2026-04-01,income,Salary,18000000,';
      const result = parseCsv(csv);
      expect(result.valid).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rowNumber).toBe(1);
      expect(result.errors[0].message).toContain('currency');
    });
  });

  describe('invalid kind', () => {
    it('produces ParseError for the bad row and still parses the others', () => {
      const csv = [
        HEADER,
        row('2026-04-01', 'income', 'Salary', '18000000', 'VND', ''),
        row('2026-04-02', 'spend', 'Coffee', '50000', 'VND', ''),
        row('2026-04-03', 'expense', 'Rent', '5500000', 'VND', ''),
      ].join('\n');
      const result = parseCsv(csv);
      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rowNumber).toBe(3); // header=1, income=2, spend=3
    });
  });

  describe('USD amount with wrong decimal count', () => {
    it('produces ParseError for 500.5 (1 decimal, not 0 or 2)', () => {
      const csv = [
        HEADER,
        row('2026-04-01', 'income', 'Salary', '500.5', 'USD', ''),
      ].join('\n');
      const result = parseCsv(csv);
      expect(result.valid).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('must look like');
    });
  });

  describe('VND amount with decimal', () => {
    it('produces ParseError for 500.00 with VND currency', () => {
      const csv = [
        HEADER,
        row('2026-04-01', 'income', 'Salary', '500.00', 'VND', ''),
      ].join('\n');
      const result = parseCsv(csv);
      expect(result.valid).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('VND');
    });
  });

  describe('quoted name containing a comma', () => {
    it('parses correctly', () => {
      const csv = `${HEADER}\n2026-04-01,income,"Smith, Jane",18000000,VND,`;
      const result = parseCsv(csv);
      expect(result.errors).toEqual([]);
      expect(result.valid[0].name).toBe('Smith, Jane');
    });
  });

  describe('quoted name containing escaped quote', () => {
    it('parses correctly', () => {
      const csv = `${HEADER}\n2026-04-01,income,"He said ""hi""",18000000,VND,`;
      const result = parseCsv(csv);
      expect(result.errors).toEqual([]);
      expect(result.valid[0].name).toBe('He said "hi"');
    });
  });

  describe('UTF-8 BOM', () => {
    it('strips leading BOM and parses the file normally', () => {
      const csv = `﻿${HEADER}\n${row('2026-04-01', 'income', 'Salary', '18000000', 'VND', '')}`;
      const result = parseCsv(csv);
      expect(result.errors).toEqual([]);
      expect(result.valid).toHaveLength(1);
    });
  });

  describe('line endings', () => {
    it('accepts CRLF line endings', () => {
      const csv = `${HEADER}\r\n${row('2026-04-01', 'income', 'Salary', '18000000', 'VND', '')}`;
      const result = parseCsv(csv);
      expect(result.errors).toEqual([]);
      expect(result.valid).toHaveLength(1);
    });

    it('accepts LF line endings', () => {
      const csv = `${HEADER}\n${row('2026-04-01', 'income', 'Salary', '18000000', 'VND', '')}`;
      const result = parseCsv(csv);
      expect(result.errors).toEqual([]);
      expect(result.valid).toHaveLength(1);
    });
  });

  describe('empty notes cell', () => {
    it('produces notes: null', () => {
      const csv = `${HEADER}\n${row('2026-04-01', 'income', 'Salary', '18000000', 'VND', '')}`;
      const result = parseCsv(csv);
      expect(result.valid[0].notes).toBeNull();
    });
  });

  describe('VND amount edge cases', () => {
    it('produces ParseError for an empty amount cell', () => {
      const csv = `${HEADER}\n2026-04-01,income,Salary,,VND,`;
      const result = parseCsv(csv);
      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('digits only');
    });

    it('produces ParseError for scientific notation like 1e3', () => {
      const csv = `${HEADER}\n2026-04-01,income,Salary,1e3,VND,`;
      const result = parseCsv(csv);
      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('USD amount conversions', () => {
    it('converts 500.00 USD to 50000 cents', () => {
      const csv = `${HEADER}\n2026-04-01,income,Consulting,500.00,USD,`;
      const result = parseCsv(csv);
      expect(result.errors).toEqual([]);
      expect(result.valid[0].amount).toEqual({ amount: 50_000, currency: 'USD' });
    });

    it('converts 500 USD (no decimals) to 50000 cents', () => {
      const csv = `${HEADER}\n2026-04-01,income,Consulting,500,USD,`;
      const result = parseCsv(csv);
      expect(result.errors).toEqual([]);
      expect(result.valid[0].amount).toEqual({ amount: 50_000, currency: 'USD' });
    });
  });

  describe('transaction fields', () => {
    it('assigns a ULID id and ISO timestamps to each valid row', () => {
      const csv = `${HEADER}\n${row('2026-04-01', 'income', 'Salary', '18000000', 'VND', '')}`;
      const result = parseCsv(csv);
      expect(result.valid[0].id).toMatch(/^[0-9A-Z]{26}$/);
      expect(result.valid[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
