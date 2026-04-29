import { z } from 'zod';
import type { Money } from '../currency/types';

export const moneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.enum(['VND', 'USD']),
}) satisfies z.ZodType<Money>;

export const transactionInputSchema = z.object({
  kind: z.enum(['income', 'expense']),
  name: z.string().trim().min(1).max(80),
  amount: moneySchema,
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().trim().max(400).nullable().default(null),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export type Transaction = TransactionInput & {
  id: string; // ULID
  createdAt: string; // IsoDateTime
  updatedAt: string; // IsoDateTime
};
