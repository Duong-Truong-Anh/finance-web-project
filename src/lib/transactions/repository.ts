import type { Transaction, NewTransaction, TransactionPatch, TransactionFilters } from './types';

export class RepositoryError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'INVALID' | 'STORAGE_UNAVAILABLE',
    message: string,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export interface TransactionRepository {
  list(filters?: TransactionFilters): Promise<Transaction[]>;
  create(input: NewTransaction): Promise<Transaction>;
  update(id: string, patch: TransactionPatch): Promise<Transaction>;
  delete(id: string): Promise<void>;
}
