import { v7 as uuidv7 } from 'uuid';
import { RepositoryError } from './repository';
import type { TransactionRepository } from './repository';
import {
  TransactionSchema,
  NewTransactionSchema,
  TransactionPatchSchema,
} from './types';
import type { Transaction, NewTransaction, TransactionPatch, TransactionFilters } from './types';

const STORAGE_KEY = 'flowstate:transactions';

function load(): Transaction[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    throw new RepositoryError('STORAGE_UNAVAILABLE', 'localStorage is not accessible');
  }
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return []; // corrupt storage — treat as empty rather than crashing
  }
  const result = TransactionSchema.array().safeParse(parsed);
  return result.success ? result.data : [];
}

function persist(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch {
    throw new RepositoryError(
      'STORAGE_UNAVAILABLE',
      'localStorage write failed — storage may be full',
    );
  }
}

function applyFilters(all: Transaction[], filters: TransactionFilters): Transaction[] {
  return all.filter((t) => {
    if (filters.month !== undefined && !t.date.startsWith(filters.month)) return false;
    if (filters.type !== undefined && t.type !== filters.type) return false;
    if (filters.category !== undefined && t.category !== filters.category) return false;
    if (filters.dateFrom !== undefined && t.date < filters.dateFrom) return false;
    if (filters.dateTo !== undefined && t.date > filters.dateTo) return false;
    return true;
  });
}

export class LocalStorageTransactionRepository implements TransactionRepository {
  async list(filters?: TransactionFilters): Promise<Transaction[]> {
    const all = load();
    return filters ? applyFilters(all, filters) : all;
  }

  async create(input: NewTransaction): Promise<Transaction> {
    const validated = NewTransactionSchema.safeParse(input);
    if (!validated.success) {
      throw new RepositoryError('INVALID', validated.error.message);
    }
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...validated.data,
      id: uuidv7(),
      createdAt: now,
      updatedAt: now,
    };
    persist([...load(), transaction]);
    return transaction;
  }

  async update(id: string, patch: TransactionPatch): Promise<Transaction> {
    const validated = TransactionPatchSchema.safeParse(patch);
    if (!validated.success) {
      throw new RepositoryError('INVALID', validated.error.message);
    }
    const all = load();
    const existing = all.find((t) => t.id === id);
    if (!existing) {
      throw new RepositoryError('NOT_FOUND', `Transaction "${id}" not found`);
    }
    const updated: Transaction = {
      ...existing,
      ...validated.data,
      updatedAt: new Date().toISOString(),
    };
    persist(all.map((t) => (t.id === id ? updated : t)));
    return updated;
  }

  async delete(id: string): Promise<void> {
    const all = load();
    if (!all.some((t) => t.id === id)) {
      throw new RepositoryError('NOT_FOUND', `Transaction "${id}" not found`);
    }
    persist(all.filter((t) => t.id !== id));
  }
}
