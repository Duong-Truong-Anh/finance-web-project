import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZodError } from 'zod';
import { createLocalStorageTransactionRepository } from './local-storage-repository';
import { StorageQuotaExceededError } from '../storage/errors';
import { STORAGE_KEYS } from '../storage/keys';
import type { TransactionInput } from './schema';

/**
 * Minimal in-memory Storage used as the test double throughout.
 * Each test gets a fresh instance from beforeEach, ensuring full isolation.
 */
class FakeStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  setItemSpy = vi.fn((key: string, value: string) => {
    this.store.set(key, value);
  });
}

const VALID_INPUT: TransactionInput = {
  kind: 'income',
  name: 'Salary',
  amount: { amount: 18_000_000, currency: 'VND' },
  occurredOn: '2026-04-01',
  notes: null,
};

const VALID_EXPENSE: TransactionInput = {
  kind: 'expense',
  name: 'Rent',
  amount: { amount: 5_500_000, currency: 'VND' },
  occurredOn: '2026-04-05',
  notes: 'April rent',
};

describe('createLocalStorageTransactionRepository', () => {
  let storage: FakeStorage;
  let fixedTime: Date;

  beforeEach(() => {
    storage = new FakeStorage();
    fixedTime = new Date('2026-04-01T00:00:00.000Z');
  });

  function makeRepo(nowFn?: () => Date) {
    return createLocalStorageTransactionRepository({
      storage,
      now: nowFn ?? (() => fixedTime),
    });
  }

  describe('list', () => {
    it('returns an empty array when no transactions exist', async () => {
      const repo = makeRepo();
      expect(await repo.list()).toEqual([]);
    });

    it('returns all transactions after creation in insertion order', async () => {
      const repo = makeRepo();
      await repo.create(VALID_INPUT);
      await repo.create(VALID_EXPENSE);
      const rows = await repo.list();
      expect(rows).toHaveLength(2);
      expect(rows[0].name).toBe('Salary');
      expect(rows[1].name).toBe('Rent');
    });
  });

  describe('create', () => {
    it('returns a transaction with input fields, a valid ULID id, and ISO timestamps', async () => {
      const repo = makeRepo();
      const tx = await repo.create(VALID_INPUT);

      expect(tx.kind).toBe('income');
      expect(tx.name).toBe('Salary');
      expect(tx.amount).toEqual({ amount: 18_000_000, currency: 'VND' });
      expect(tx.amount.currency).toBe('VND');
      expect(tx.occurredOn).toBe('2026-04-01');
      expect(tx.notes).toBeNull();

      // ULID: 26 uppercase alphanumeric chars
      expect(tx.id).toMatch(/^[0-9A-Z]{26}$/);

      expect(tx.createdAt).toBe(fixedTime.toISOString());
      expect(tx.updatedAt).toBe(fixedTime.toISOString());
    });

    it('trims whitespace from name per schema', async () => {
      const repo = makeRepo();
      const tx = await repo.create({ ...VALID_INPUT, name: '  Salary  ' });
      expect(tx.name).toBe('Salary');
    });

    it('throws ZodError when input is invalid', async () => {
      const repo = makeRepo();
      await expect(
        repo.create({ ...VALID_INPUT, amount: { amount: -1, currency: 'VND' } } as TransactionInput),
      ).rejects.toThrow(ZodError);
    });

    it('throws ZodError when name is empty after trimming', async () => {
      const repo = makeRepo();
      await expect(
        repo.create({ ...VALID_INPUT, name: '   ' }),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('findById', () => {
    it('returns the matching transaction', async () => {
      const repo = makeRepo();
      const tx = await repo.create(VALID_INPUT);
      const found = await repo.findById(tx.id);
      expect(found).toEqual(tx);
    });

    it('returns null for a non-existent id', async () => {
      const repo = makeRepo();
      expect(await repo.findById('NONEXISTENTID00000000000000')).toBeNull();
    });
  });

  describe('update', () => {
    it('merges the patch and bumps updatedAt', async () => {
      const t1 = new Date('2026-04-01T10:00:00.000Z');
      const t2 = new Date('2026-04-01T11:00:00.000Z');
      let call = 0;
      const repo = makeRepo(() => (call++ === 0 ? t1 : t2));

      const tx = await repo.create(VALID_INPUT);
      const updated = await repo.update(tx.id, { name: 'Updated Salary' });

      expect(updated.name).toBe('Updated Salary');
      expect(updated.amount).toEqual(tx.amount);
      expect(updated.createdAt).toBe(t1.toISOString());
      expect(updated.updatedAt).toBe(t2.toISOString());
    });

    it('throws when the id does not exist', async () => {
      const repo = makeRepo();
      await expect(
        repo.update('NONEXISTENTID00000000000000', { name: 'Ghost' }),
      ).rejects.toThrow('Transaction not found');
    });

    it('throws ZodError when patch is invalid', async () => {
      const repo = makeRepo();
      const tx = await repo.create(VALID_INPUT);
      await expect(
        repo.update(tx.id, { amount: { amount: -999, currency: 'VND' } } as Partial<TransactionInput>),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('remove', () => {
    it('removes the transaction so list no longer contains it', async () => {
      const repo = makeRepo();
      const tx = await repo.create(VALID_INPUT);
      await repo.remove(tx.id);
      expect(await repo.list()).toHaveLength(0);
    });

    it('is a no-op when the id is missing', async () => {
      const repo = makeRepo();
      await repo.create(VALID_INPUT);
      await expect(
        repo.remove('NONEXISTENTID00000000000000'),
      ).resolves.toBeUndefined();
      expect(await repo.list()).toHaveLength(1);
    });
  });

  describe('bulkCreate', () => {
    it('creates N transactions and list returns all of them', async () => {
      const repo = makeRepo();
      const inputs: TransactionInput[] = Array.from({ length: 5 }, (_, i) => ({
        ...VALID_INPUT,
        name: `Item ${i + 1}`,
        amount: { amount: (i + 1) * 1_000_000, currency: 'VND' as const },
      }));
      const created = await repo.bulkCreate(inputs);
      expect(created).toHaveLength(5);
      expect(await repo.list()).toHaveLength(5);
    });

    it('writes to storage exactly once regardless of input array length', async () => {
      // Spy on storage.setItem to count calls
      const setItemSpy = vi.spyOn(storage, 'setItem');
      const repo = makeRepo();
      const inputs: TransactionInput[] = Array.from({ length: 5 }, (_, i) => ({
        ...VALID_INPUT,
        name: `Bulk ${i + 1}`,
      }));

      await repo.bulkCreate(inputs);

      // Only one setItem call for the transactions key
      const txCalls = setItemSpy.mock.calls.filter(
        ([key]) => key === STORAGE_KEYS.transactions,
      );
      expect(txCalls).toHaveLength(1);
    });

    it('returns an empty array for an empty inputs array', async () => {
      const repo = makeRepo();
      expect(await repo.bulkCreate([])).toEqual([]);
    });
  });

  describe('clear', () => {
    it('removes all transactions so list returns empty', async () => {
      const repo = makeRepo();
      await repo.create(VALID_INPUT);
      await repo.create(VALID_EXPENSE);
      await repo.clear();
      expect(await repo.list()).toEqual([]);
    });
  });

  describe('corrupt-data recovery', () => {
    it('returns [] and renames the bad key when storage holds malformed JSON', async () => {
      const today = new Date().toISOString().slice(0, 10);
      storage.setItem(STORAGE_KEYS.transactions, 'not-json{{{{');

      const repo = makeRepo();
      const rows = await repo.list();

      expect(rows).toEqual([]);
      expect(storage.getItem(STORAGE_KEYS.transactions)).toBeNull();
      expect(
        storage.getItem(`${STORAGE_KEYS.transactions}.broken-${today}`),
      ).toBe('not-json{{{{');
    });
  });

  describe('quota-exceeded propagation', () => {
    it('bubbles StorageQuotaExceededError from the adapter on create', async () => {
      const quotaStorage = new FakeStorage();
      let callCount = 0;
      vi.spyOn(quotaStorage, 'setItem').mockImplementation(() => {
        // Allow the first read-back (getItem) to work; throw on any setItem
        callCount++;
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      const repo = createLocalStorageTransactionRepository({
        storage: quotaStorage,
        now: () => fixedTime,
      });

      await expect(repo.create(VALID_INPUT)).rejects.toThrow(
        StorageQuotaExceededError,
      );
    });
  });

  describe('createMany', () => {
    it('is a no-op when input is empty — no write occurs', async () => {
      const setItemSpy = vi.spyOn(storage, 'setItem');
      const repo = makeRepo();
      await repo.createMany([]);
      const txCalls = setItemSpy.mock.calls.filter(([key]) => key === STORAGE_KEYS.transactions);
      expect(txCalls).toHaveLength(0);
    });

    it('inserts all rows and preserves pre-existing transactions', async () => {
      const repo = makeRepo();
      const d = await repo.create(VALID_INPUT); // pre-existing

      // Build three Transaction objects via bulkCreate then copy them
      const [a, b, c] = await repo.bulkCreate([
        { ...VALID_EXPENSE, name: 'A' },
        { ...VALID_EXPENSE, name: 'B' },
        { ...VALID_EXPENSE, name: 'C' },
      ]);

      // Remove what bulkCreate added so we can re-insert via createMany
      await repo.remove(a.id);
      await repo.remove(b.id);
      await repo.remove(c.id);

      await repo.createMany([a, b, c]);

      const all = await repo.list();
      expect(all).toHaveLength(4);
      const ids = all.map((t) => t.id);
      expect(ids).toContain(d.id);
      expect(ids).toContain(a.id);
      expect(ids).toContain(b.id);
      expect(ids).toContain(c.id);
    });

    it('preserves transactions from a prior create() call', async () => {
      const repo = makeRepo();
      const x = await repo.create(VALID_INPUT);
      const extra = await repo.create(VALID_EXPENSE);
      // Remove extra so we can re-insert via createMany
      await repo.remove(extra.id);

      await repo.createMany([extra]);

      const all = await repo.list();
      expect(all.map((t) => t.id)).toContain(x.id);
      expect(all.map((t) => t.id)).toContain(extra.id);
    });

    it('writes to storage exactly once for N transactions', async () => {
      const setItemSpy = vi.spyOn(storage, 'setItem');
      const repo = makeRepo();

      const [tx1, tx2, tx3] = await repo.bulkCreate([
        { ...VALID_INPUT, name: 'One' },
        { ...VALID_INPUT, name: 'Two' },
        { ...VALID_INPUT, name: 'Three' },
      ]);
      await repo.clear();

      setItemSpy.mockClear();
      await repo.createMany([tx1, tx2, tx3]);

      const txCalls = setItemSpy.mock.calls.filter(([key]) => key === STORAGE_KEYS.transactions);
      expect(txCalls).toHaveLength(1);
    });
  });

  describe('round trip', () => {
    it('preserves all fields through create → list', async () => {
      const repo = makeRepo();
      const input: TransactionInput = {
        kind: 'expense',
        name: 'Coffee',
        amount: { amount: 50_000, currency: 'VND' },
        occurredOn: '2026-04-15',
        notes: 'morning coffee',
      };
      const created = await repo.create(input);
      const [fromList] = await repo.list();

      expect(fromList).toEqual(created);
      expect(fromList.kind).toBe('expense');
      expect(fromList.name).toBe('Coffee');
      expect(fromList.amount).toEqual({ amount: 50_000, currency: 'VND' });
      expect(fromList.amount.currency).toBe('VND');
      expect(fromList.occurredOn).toBe('2026-04-15');
      expect(fromList.notes).toBe('morning coffee');
    });
  });
});
