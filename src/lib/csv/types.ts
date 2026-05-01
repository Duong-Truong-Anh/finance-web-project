import type { Transaction } from '../transactions/schema';

export type ParseError = {
  rowNumber: number; // 1-based; header = row 1, first data row = row 2
  message: string;
  rawRow: string; // original CSV line, for error preview UI
};

export type ParseResult = {
  valid: Transaction[]; // ready to insert; ULID + timestamps already assigned by the factory
  errors: ParseError[]; // shown to user; not inserted
};
