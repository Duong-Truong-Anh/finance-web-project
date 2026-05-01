import type { Transaction } from '../transactions/schema';

const HEADER = 'date,kind,name,amount,currency,notes';

// Replaces embedded newlines with a space so the serializer never produces
// RFC-4180 multi-line records. The line-splitting parser cannot handle them,
// so allowing newlines through would break export → import round-trips.
function normalizeField(value: string): string {
  return value.replace(/[\r\n]+/g, ' ');
}

// Wraps a field in quotes if it contains , or ". Newlines are already
// normalized out by normalizeField before this is called.
function quoteField(value: string): string {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Converts integer minor units to a major-unit string.
// VND: no decimals. USD: always exactly two decimal places.
function toMajorUnits(amount: number, currency: 'VND' | 'USD'): string {
  if (currency === 'VND') {
    return String(amount);
  }
  // USD: split cents into dollars and cents without float arithmetic
  const dollars = Math.floor(amount / 100);
  const cents = amount % 100;
  return `${dollars}.${String(cents).padStart(2, '0')}`;
}

export function serializeCsv(transactions: Transaction[]): string {
  // Sort: date descending, then id descending — deterministic, matches table order
  const sorted = [...transactions].sort((a, b) => {
    const dateCmp = b.occurredOn.localeCompare(a.occurredOn);
    if (dateCmp !== 0) return dateCmp;
    return b.id.localeCompare(a.id);
  });

  const rows = sorted.map((tx) => {
    const fields = [
      tx.occurredOn,
      tx.kind,
      normalizeField(tx.name),
      toMajorUnits(tx.amount.amount, tx.amount.currency),
      tx.amount.currency,
      normalizeField(tx.notes ?? ''),
    ];
    return fields.map(quoteField).join(',');
  });

  // CRLF between rows per RFC 4180; trailing newline at end of file
  return [HEADER, ...rows].join('\r\n') + '\r\n';
}
