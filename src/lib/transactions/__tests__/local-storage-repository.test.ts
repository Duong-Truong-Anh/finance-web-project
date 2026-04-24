import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageTransactionRepository } from '../local-storage-repository';
import { RepositoryError } from '../repository';
import type { NewTransaction } from '../types';

function makeTx(overrides: Partial<NewTransaction> = {}): NewTransaction {
  return {
    type: 'income',
    name: 'Salary',
    amount: 5_000_000, // 5,000,000 VND đồng
    date: '2026-01-15',
    category: 'salary',
    recurring: false,
    ...overrides,
  };
}

describe('LocalStorageTransactionRepository', () => {
  let repo: LocalStorageTransactionRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageTransactionRepository();
  });

  // ─── list ────────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns an empty array when storage is empty', async () => {
      expect(await repo.list()).toEqual([]);
    });

    it('returns all transactions when no filter is provided', async () => {
      await repo.create(makeTx({ name: 'A' }));
      await repo.create(makeTx({ name: 'B' }));
      expect(await repo.list()).toHaveLength(2);
    });

    // edge case: month filter excludes transactions in other months
    it('filters by month — returns only transactions in the given YYYY-MM', async () => {
      await repo.create(makeTx({ date: '2026-01-15' }));
      await repo.create(makeTx({ date: '2026-02-10' }));
      const jan = await repo.list({ month: '2026-01' });
      expect(jan).toHaveLength(1);
      expect(jan[0]?.date).toBe('2026-01-15');
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('returns the created transaction with id, createdAt, updatedAt injected', async () => {
      const tx = await repo.create(makeTx());
      expect(tx.id).toBeTruthy();
      expect(tx.createdAt).toBeTruthy();
      expect(tx.updatedAt).toBeTruthy();
      expect(tx.name).toBe('Salary');
    });

    it('persists the transaction so subsequent list() returns it', async () => {
      await repo.create(makeTx());
      expect(await repo.list()).toHaveLength(1);
    });

    // edge case: Zod rejects a non-positive amount (must be integer > 0)
    it('throws RepositoryError with code INVALID for a zero or negative amount', async () => {
      const zeroPromise = repo.create(makeTx({ amount: 0 }));
      await expect(zeroPromise).rejects.toBeInstanceOf(RepositoryError);
      await expect(zeroPromise).rejects.toMatchObject({ code: 'INVALID' });

      const negativePromise = repo.create(makeTx({ amount: -500 }));
      await expect(negativePromise).rejects.toBeInstanceOf(RepositoryError);
      await expect(negativePromise).rejects.toMatchObject({ code: 'INVALID' });
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('applies the patch and returns the updated transaction', async () => {
      const tx = await repo.create(makeTx({ name: 'Old name' }));
      const updated = await repo.update(tx.id, { name: 'New name' });
      expect(updated.name).toBe('New name');
    });

    it('bumps updatedAt while preserving createdAt', async () => {
      const tx = await repo.create(makeTx());
      // Force a tick so updatedAt can differ
      await new Promise((r) => setTimeout(r, 2));
      const updated = await repo.update(tx.id, { name: 'Rename' });
      expect(updated.createdAt).toBe(tx.createdAt);
      expect(updated.updatedAt >= tx.updatedAt).toBe(true);
    });

    it('preserves fields not included in the patch', async () => {
      const tx = await repo.create(makeTx({ amount: 1_000_000 }));
      const updated = await repo.update(tx.id, { name: 'Renamed' });
      expect(updated.amount).toBe(1_000_000);
    });

    // edge case: unknown id throws NOT_FOUND
    it('throws RepositoryError with code NOT_FOUND for an unknown id', async () => {
      const p = repo.update('does-not-exist', { name: 'X' });
      await expect(p).rejects.toBeInstanceOf(RepositoryError);
      await expect(p).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('removes the transaction so it no longer appears in list()', async () => {
      const tx = await repo.create(makeTx());
      await repo.delete(tx.id);
      expect(await repo.list()).toHaveLength(0);
    });

    it('does not remove other transactions', async () => {
      const tx1 = await repo.create(makeTx({ name: 'Keep' }));
      const tx2 = await repo.create(makeTx({ name: 'Delete me' }));
      await repo.delete(tx2.id);
      const remaining = await repo.list();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.id).toBe(tx1.id);
    });

    // edge case: unknown id throws NOT_FOUND
    it('throws RepositoryError with code NOT_FOUND for an unknown id', async () => {
      const p = repo.delete('does-not-exist');
      await expect(p).rejects.toBeInstanceOf(RepositoryError);
      await expect(p).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
