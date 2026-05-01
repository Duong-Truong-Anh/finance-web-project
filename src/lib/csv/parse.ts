import { ZodError } from 'zod';
import { createTransaction } from '../transactions/factories';
import type { Currency } from '../currency/types';
import type { ParseError, ParseResult } from './types';

const REQUIRED_COLUMNS = ['date', 'kind', 'name', 'amount', 'currency', 'notes'] as const;

// Converts a major-unit CSV string to integer minor units.
// Never uses parseFloat — splits on '.' to avoid float imprecision.
function toMinorUnits(majorString: string, currency: Currency): number {
  const trimmed = majorString.trim();
  if (currency === 'VND') {
    // Reject empty strings, scientific notation (1e3), hex (0x10), decimals, etc.
    if (!/^\d+$/.test(trimmed)) {
      throw new Error('VND amount must be a non-negative integer (digits only)');
    }
    return Number(trimmed);
  }
  // USD: 'NNN' or 'NNN.DD'. Exactly 0 or 2 decimal places.
  const match = /^(\d+)(?:\.(\d{2}))?$/.exec(trimmed);
  if (!match) {
    throw new Error('USD amount must look like 500 or 500.00');
  }
  const major = Number(match[1]);
  const cents = match[2] ? Number(match[2]) : 0;
  return major * 100 + cents;
}

// RFC 4180-compliant single-line tokenizer.
// Handles quoted fields, escaped quotes (""), and trailing commas → empty final field.
function tokenizeRow(line: string): string[] {
  const fields: string[] = [];
  let i = 0;

  while (true) {
    if (i < line.length && line[i] === '"') {
      let value = '';
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            value += '"';
            i += 2;
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          value += line[i++];
        }
      }
      fields.push(value);
    } else {
      const start = i;
      while (i < line.length && line[i] !== ',') i++;
      fields.push(line.slice(start, i));
    }

    if (i >= line.length) break;
    i++; // skip comma separator
    if (i >= line.length) {
      fields.push(''); // trailing comma → empty last field
      break;
    }
  }

  return fields;
}

export function parseCsv(input: string): ParseResult {
  const valid: ReturnType<typeof createTransaction>[] = [];
  const errors: ParseError[] = [];

  // Strip UTF-8 BOM (Excel writes one on save-as CSV)
  const text = input.startsWith('﻿') ? input.slice(1) : input;

  // Normalise line endings; drop trailing blank lines
  const lines = text.split(/\r?\n/);
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  if (lines.length === 0) return { valid, errors };

  // Parse header — row 1
  const headerLine = lines[0];
  const headerFields = tokenizeRow(headerLine).map((h) => h.toLowerCase().trim());

  const colIndex: Record<string, number> = {};
  for (let i = 0; i < headerFields.length; i++) {
    colIndex[headerFields[i]] = i;
  }

  const missing = REQUIRED_COLUMNS.filter((col) => !(col in colIndex));
  if (missing.length > 0) {
    errors.push({
      rowNumber: 1,
      message: `Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      rawRow: headerLine,
    });
    return { valid, errors };
  }

  // Parse data rows — rows 2+
  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const rawRow = lines[lineIdx];
    if (rawRow.trim() === '') continue; // silently skip blank lines between rows

    const rowNumber = lineIdx + 1; // 1-based; header is row 1
    const fields = tokenizeRow(rawRow);

    try {
      const date = fields[colIndex['date']]?.trim() ?? '';
      const kind = fields[colIndex['kind']]?.trim() ?? '';
      const name = fields[colIndex['name']]?.trim() ?? '';
      const amountStr = fields[colIndex['amount']]?.trim() ?? '';
      const currencyRaw = fields[colIndex['currency']]?.trim().toUpperCase() ?? '';
      const notesRaw = fields[colIndex['notes']]?.trim() ?? '';

      if (currencyRaw !== 'VND' && currencyRaw !== 'USD') {
        throw new Error(`Invalid currency: "${currencyRaw}". Must be VND or USD.`);
      }
      const currency = currencyRaw as Currency;

      const amountMinor = toMinorUnits(amountStr, currency);

      // Map CSV flat shape → TransactionInput nested shape.
      // Notes: empty string in CSV → null (round-trip safe: null serialises as empty cell).
      const input = {
        kind: kind as 'income' | 'expense',
        name,
        amount: { amount: amountMinor, currency },
        occurredOn: date,
        notes: notesRaw === '' ? null : notesRaw,
      };

      // Factory validates through Zod schema and assigns ULID + timestamps.
      const tx = createTransaction(input);
      valid.push(tx);
    } catch (err) {
      let message: string;
      if (err instanceof ZodError) {
        message = err.issues.map((e) => e.message).join('; ');
      } else {
        message = err instanceof Error ? err.message : String(err);
      }
      errors.push({ rowNumber, message, rawRow });
    }
  }

  return { valid, errors };
}
