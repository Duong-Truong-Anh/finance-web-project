import { describe, it, expect } from 'vitest';
import { serializeCsv } from './serialize';
import { parseCsv } from './parse';
import { createTransaction } from '../transactions/factories';
import type { Transaction } from '../transactions/schema';

// The factory assigns a new ULID on every parsed row — that is correct behaviour,
// because import treats every CSV row as a *new* transaction. Round-trip equality
// is therefore on the data fields (kind, name, amount, occurredOn, notes), not on
// the auto-generated ids / timestamps.

type DataFields = Pick<Transaction, 'kind' | 'name' | 'amount' | 'occurredOn' | 'notes'>;

function stripIds(txs: Transaction[]): DataFields[] {
  return txs.map(({ kind, name, amount, occurredOn, notes }) => ({
    kind,
    name,
    amount,
    occurredOn,
    notes,
  }));
}

function stableSort(arr: DataFields[]): DataFields[] {
  return [...arr].sort((a, b) => {
    // Canonical sort key covers all data fields so two transactions that differ
    // only in a single field still land in the correct relative position.
    const key = (t: DataFields) =>
      `${t.occurredOn}|${t.kind}|${t.name}|${t.amount.amount}|${t.amount.currency}|${t.notes ?? ''}`;
    return key(a).localeCompare(key(b));
  });
}

// 10 fixtures covering: both currencies, income + expense, names with commas /
// quotes / accents, empty and non-empty notes, multiple same-date transactions.
const fixtures: Transaction[] = [
  createTransaction({
    kind: 'income',
    name: 'Salary',
    amount: { amount: 18_000_000, currency: 'VND' },
    occurredOn: '2026-04-01',
    notes: 'April salary',
  }),
  createTransaction({
    kind: 'expense',
    name: 'Rent',
    amount: { amount: 5_500_000, currency: 'VND' },
    occurredOn: '2026-04-05',
    notes: null,
  }),
  createTransaction({
    kind: 'expense',
    name: 'Coffee',
    amount: { amount: 50_000, currency: 'VND' },
    occurredOn: '2026-04-05', // same date as Rent — tests same-date sort
    notes: null,
  }),
  createTransaction({
    kind: 'income',
    name: 'Freelance, consulting', // comma in name
    amount: { amount: 30_000, currency: 'USD' }, // $300.00
    occurredOn: '2026-03-15',
    notes: null,
  }),
  createTransaction({
    kind: 'expense',
    name: 'He said "top secret"', // quote in name
    amount: { amount: 1_000, currency: 'USD' }, // $10.00
    occurredOn: '2026-03-20',
    notes: 'quoted name test',
  }),
  createTransaction({
    kind: 'expense',
    name: 'Phở bò', // accented characters
    amount: { amount: 80_000, currency: 'VND' },
    occurredOn: '2026-03-10',
    notes: null,
  }),
  createTransaction({
    kind: 'income',
    name: 'Dividend',
    amount: { amount: 5, currency: 'USD' }, // $0.05 — tests sub-dollar cents
    occurredOn: '2026-02-28',
    notes: 'tiny amount',
  }),
  createTransaction({
    kind: 'expense',
    name: 'Internet',
    amount: { amount: 350_000, currency: 'VND' },
    occurredOn: '2026-02-15',
    notes: null,
  }),
  createTransaction({
    kind: 'income',
    name: 'Bonus',
    amount: { amount: 5_000_000, currency: 'VND' },
    occurredOn: '2026-02-15', // same date as Internet — tests same-date sort
    notes: 'Q4 bonus',
  }),
  createTransaction({
    kind: 'expense',
    name: 'USD expense',
    amount: { amount: 1_999, currency: 'USD' }, // $19.99
    occurredOn: '2026-01-31',
    notes: null,
  }),
];

describe('CSV round-trip', () => {
  it('parse(serialize(fixtures)).valid is data-equal to fixtures', () => {
    const csv = serializeCsv(fixtures);
    const result = parseCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.valid).toHaveLength(fixtures.length);

    const parsedData = stableSort(stripIds(result.valid));
    const fixtureData = stableSort(stripIds(fixtures));

    expect(parsedData).toEqual(fixtureData);
  });

  it('produces no parse errors on a well-formed serialized file', () => {
    const csv = serializeCsv(fixtures);
    expect(parseCsv(csv).errors).toEqual([]);
  });

  it('serializes and re-parses a single USD row losslessly', () => {
    const single = fixtures.filter((t) => t.amount.currency === 'USD');
    const csv = serializeCsv(single);
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    const parsedData = stableSort(stripIds(result.valid));
    const originalData = stableSort(stripIds(single));
    expect(parsedData).toEqual(originalData);
  });
});
