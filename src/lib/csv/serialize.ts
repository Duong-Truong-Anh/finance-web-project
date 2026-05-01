import type { Transaction } from '../transactions/schema';

const HEADER = 'date,kind,name,amount,currency,notes';

// Wraps a field in quotes if it contains any RFC 4180 special characters.
// Escapes internal double-quotes as "".
function quoteField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\r') || value.includes('\n')) {
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
      tx.name,
      toMajorUnits(tx.amount.amount, tx.amount.currency),
      tx.amount.currency,
      tx.notes ?? '',
    ];
    return fields.map(quoteField).join(',');
  });

  // CRLF between rows per RFC 4180; trailing newline at end of file
  return [HEADER, ...rows].join('\r\n') + '\r\n';
}
