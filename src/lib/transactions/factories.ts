import { ulid } from 'ulid';
import { transactionInputSchema, type Transaction, type TransactionInput } from './schema';

export function createTransaction(
  input: TransactionInput,
  now: () => Date = () => new Date(),
): Transaction {
  const validated = transactionInputSchema.parse(input);
  const timestamp = now().toISOString();
  return {
    ...validated,
    id: ulid(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
