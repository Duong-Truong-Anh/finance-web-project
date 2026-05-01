import { describe, it, expect } from 'vitest';
import { serializeCsv } from './serialize';
import { createTransaction } from '../transactions/factories';
import type { Transaction } from '../transactions/schema';

const HEADER = 'date,kind,name,amount,currency,notes';

function makeTx(
  overrides: Partial<Parameters<typeof createTransaction>[0]> & {
    occurredOn?: string;
    id?: string;
  } = {},
): Transaction {
  const base = {
    kind: 'income' as const,
    name: 'Test',
    amount: { amount: 18_000_000, currency: 'VND' as const },
    occurredOn: '2026-04-01',
    notes: null,
  };
  const tx = createTransaction({ ...base, ...overrides });
  // Allow overriding id for sort-order tests
  if (overrides.id) return { ...tx, id: overrides.id };
  return tx;
}

describe('serializeCsv', () => {
  describe('empty input', () => {
    it('returns just the header line followed by CRLF', () => {
      expect(serializeCsv([])).toBe(`${HEADER}\r\n`);
    });
  });

  describe('VND amount', () => {
    it('emits no decimal point', () => {
      const csv = serializeCsv([makeTx({ amount: { amount: 18_000_000, currency: 'VND' } })]);
      const [, dataRow] = csv.split('\r\n');
      const fields = dataRow.split(',');
      expect(fields[3]).toBe('18000000');
    });
  });

  describe('USD amount', () => {
    it('emits exactly two decimal places for 50000 cents → 500.00', () => {
      const csv = serializeCsv([makeTx({ amount: { amount: 50_000, currency: 'USD' } })]);
      const [, dataRow] = csv.split('\r\n');
      const fields = dataRow.split(',');
      expect(fields[3]).toBe('500.00');
    });

    it('emits 0.05 for 5 cents', () => {
      const csv = serializeCsv([makeTx({ amount: { amount: 5, currency: 'USD' } })]);
      const [, dataRow] = csv.split('\r\n');
      const fields = dataRow.split(',');
      expect(fields[3]).toBe('0.05');
    });

    it('emits correct value for 1 cent', () => {
      const csv = serializeCsv([makeTx({ amount: { amount: 1, currency: 'USD' } })]);
      const [, dataRow] = csv.split('\r\n');
      const fields = dataRow.split(',');
      expect(fields[3]).toBe('0.01');
    });
  });

  describe('RFC 4180 quoting', () => {
    it('quotes a name containing a comma', () => {
      const csv = serializeCsv([makeTx({ name: 'Smith, Jane' })]);
      expect(csv).toContain('"Smith, Jane"');
    });

    it('quotes and escapes a name containing an internal double-quote', () => {
      const csv = serializeCsv([makeTx({ name: 'He said "hi"' })]);
      expect(csv).toContain('"He said ""hi"""');
    });

    it('does not quote plain names', () => {
      const csv = serializeCsv([makeTx({ name: 'Salary' })]);
      // Salary should not be wrapped in quotes
      const [, dataRow] = csv.split('\r\n');
      expect(dataRow).not.toContain('"Salary"');
      expect(dataRow).toContain('Salary');
    });
  });

  describe('notes field', () => {
    it('emits empty cell (no quotes) for null notes', () => {
      const tx = makeTx({ notes: null });
      const csv = serializeCsv([tx]);
      const [, dataRow] = csv.split('\r\n');
      // Last field after the last comma should be empty
      const lastCommaIdx = dataRow.lastIndexOf(',');
      expect(dataRow.slice(lastCommaIdx + 1)).toBe('');
    });

    it('emits the notes text when present', () => {
      const csv = serializeCsv([makeTx({ notes: 'April rent' })]);
      expect(csv).toContain('April rent');
    });
  });

  describe('column order', () => {
    it('emits date,kind,name,amount,currency,notes in header', () => {
      expect(serializeCsv([]).startsWith('date,kind,name,amount,currency,notes')).toBe(true);
    });

    it('maps occurredOn to the date column', () => {
      const csv = serializeCsv([makeTx({ occurredOn: '2026-04-15' })]);
      const [, dataRow] = csv.split('\r\n');
      expect(dataRow.startsWith('2026-04-15,')).toBe(true);
    });
  });

  describe('sort order', () => {
    it('sorts by date descending', () => {
      const txA = makeTx({ occurredOn: '2026-04-01' });
      const txB = makeTx({ occurredOn: '2026-04-15' });
      const csv = serializeCsv([txA, txB]);
      const lines = csv.split('\r\n').filter(Boolean);
      // line[0] = header, line[1] = most recent date
      expect(lines[1].startsWith('2026-04-15,')).toBe(true);
      expect(lines[2].startsWith('2026-04-01,')).toBe(true);
    });

    it('sorts by id descending within the same date', () => {
      // Lexicographically: '01...' < '02...' so id '02...' should come first
      const txA = makeTx({ occurredOn: '2026-04-01', id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' });
      const txB = makeTx({ occurredOn: '2026-04-01', id: '02ARZ3NDEKTSV4RRFFQ69G5FAV' });
      const csv = serializeCsv([txA, txB]);
      const lines = csv.split('\r\n').filter(Boolean);
      // txB has higher id so it should appear first
      expect(lines[1]).toContain(txB.name);
    });
  });

  describe('line endings and trailing newline', () => {
    it('uses CRLF between rows', () => {
      const csv = serializeCsv([makeTx()]);
      expect(csv).toContain('\r\n');
    });

    it('ends with a trailing CRLF', () => {
      expect(serializeCsv([]).endsWith('\r\n')).toBe(true);
      expect(serializeCsv([makeTx()]).endsWith('\r\n')).toBe(true);
    });
  });
});
