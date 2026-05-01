import type { Transaction, TransactionInput } from './schema';

export interface TransactionRepository {
  list(): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | null>;
  create(input: TransactionInput): Promise<Transaction>;
  update(id: string, patch: Partial<TransactionInput>): Promise<Transaction>;
  remove(id: string): Promise<void>;
  bulkCreate(inputs: TransactionInput[]): Promise<Transaction[]>;
  // Bulk-insert pre-formed Transaction objects (ULIDs already assigned by the caller).
  // One read + one write regardless of input length. No-op for empty array.
  createMany(transactions: Transaction[]): Promise<void>;
  clear(): Promise<void>;
}
