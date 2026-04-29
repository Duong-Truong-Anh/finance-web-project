import { z } from 'zod';

export const transactionInputSchema = z.object({
  kind: z.enum(['income', 'expense']),
  name: z.string().trim().min(1).max(80),
  amount: z.number().int().nonnegative(),
  currency: z.enum(['VND', 'USD']),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().trim().max(400).nullable().default(null),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export type Transaction = TransactionInput & {
  id: string; // ULID
  createdAt: string; // IsoDateTime
  updatedAt: string; // IsoDateTime
};
