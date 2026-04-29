import { ulid } from 'ulid';
import { createStorageAdapter } from '../storage/adapter';
import { STORAGE_KEYS } from '../storage/keys';
import {
  transactionInputSchema,
  type Transaction,
  type TransactionInput,
} from './schema';
import type { TransactionRepository } from './repository';

export function createLocalStorageTransactionRepository(opts?: {
  storage?: Storage;
  now?: () => Date;
}): TransactionRepository {
  const adapter = createStorageAdapter(opts?.storage ?? globalThis.localStorage);
  const now = opts?.now ?? (() => new Date());
  const KEY = STORAGE_KEYS.transactions;

  function readAll(): Transaction[] {
    return adapter.read<Transaction[]>(KEY, []);
  }

  function writeAll(rows: Transaction[]): void {
    adapter.write(KEY, rows);
  }

  return {
    async list(): Promise<Transaction[]> {
      return Promise.resolve(readAll());
    },

    async findById(id: string): Promise<Transaction | null> {
      const rows = readAll();
      return Promise.resolve(rows.find((r) => r.id === id) ?? null);
    },

    async create(input: TransactionInput): Promise<Transaction> {
      const validated = transactionInputSchema.parse(input);
      const timestamp = now().toISOString();
      const row: Transaction = {
        ...validated,
        id: ulid(),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const rows = readAll();
      rows.push(row);
      writeAll(rows);
      return Promise.resolve(row);
    },

    async update(id: string, patch: Partial<TransactionInput>): Promise<Transaction> {
      const validatedPatch = transactionInputSchema.partial().parse(patch);
      const rows = readAll();
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) {
        return Promise.reject(new Error('Transaction not found'));
      }
      const updated: Transaction = {
        ...rows[idx],
        ...validatedPatch,
        updatedAt: now().toISOString(),
      };
      rows[idx] = updated;
      writeAll(rows);
      return Promise.resolve(updated);
    },

    async remove(id: string): Promise<void> {
      const rows = readAll().filter((r) => r.id !== id);
      writeAll(rows);
      return Promise.resolve();
    },

    async bulkCreate(inputs: TransactionInput[]): Promise<Transaction[]> {
      const existing = readAll();
      const created: Transaction[] = inputs.map((input) => {
        const validated = transactionInputSchema.parse(input);
        const timestamp = now().toISOString();
        return {
          ...validated,
          id: ulid(),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
      });
      writeAll([...existing, ...created]);
      return Promise.resolve(created);
    },

    async clear(): Promise<void> {
      adapter.remove(KEY);
      return Promise.resolve();
    },
  };
}
