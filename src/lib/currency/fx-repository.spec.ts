import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFxRepository, FxUnavailableError } from './fx-repository';
import { STORAGE_KEYS } from '../storage/keys';
import type { FxRateSnapshot } from './types';

// FakeStorage from the same Map-backed pattern used in adapter.spec.ts and
// local-storage-repository.spec.ts.
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
}

const TODAY = new Date('2026-04-30T12:00:00Z');
const YESTERDAY = new Date('2026-04-29T12:00:00Z');

const MOCK_SNAPSHOT: FxRateSnapshot = {
  base: 'USD',
  rates: { VND: 25_000, USD: 1 },
  fetchedAt: TODAY.toISOString(),
};

function makeFetcher(snapshot: FxRateSnapshot = MOCK_SNAPSHOT) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(snapshot),
  });
}

function makeFailingFetcher() {
  return vi.fn().mockResolvedValue({ ok: false, status: 502 });
}

describe('createFxRepository', () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
  });

  describe('getCurrent', () => {
    it('returns cached value when cache exists and is from the same UTC day', async () => {
      const cachedSnapshot: FxRateSnapshot = {
        base: 'USD',
        rates: { VND: 24_000, USD: 1 },
        fetchedAt: '2026-04-30T06:00:00Z',
      };
      storage.setItem(STORAGE_KEYS.fx, JSON.stringify(cachedSnapshot));

      const fetcher = makeFetcher();
      const repo = createFxRepository({ storage, fetcher, now: () => TODAY });

      const result = await repo.getCurrent();

      expect(result).toEqual(cachedSnapshot);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('fetches and caches when no cache exists', async () => {
      const fetcher = makeFetcher();
      const repo = createFxRepository({ storage, fetcher, now: () => TODAY });

      const result = await repo.getCurrent();

      expect(result).toEqual(MOCK_SNAPSHOT);
      expect(fetcher).toHaveBeenCalledOnce();
      // Verify the snapshot was persisted
      const stored = JSON.parse(storage.getItem(STORAGE_KEYS.fx)!);
      expect(stored).toEqual(MOCK_SNAPSHOT);
    });

    it('fetches and caches when cache is stale (different UTC day)', async () => {
      const staleSnapshot: FxRateSnapshot = {
        base: 'USD',
        rates: { VND: 24_000, USD: 1 },
        fetchedAt: YESTERDAY.toISOString(),
      };
      storage.setItem(STORAGE_KEYS.fx, JSON.stringify(staleSnapshot));

      const fetcher = makeFetcher();
      const repo = createFxRepository({ storage, fetcher, now: () => TODAY });

      const result = await repo.getCurrent();

      expect(result).toEqual(MOCK_SNAPSHOT);
      expect(fetcher).toHaveBeenCalledOnce();
    });

    it('returns stale cache when fetch fails and a cached snapshot exists', async () => {
      const staleSnapshot: FxRateSnapshot = {
        base: 'USD',
        rates: { VND: 24_000, USD: 1 },
        fetchedAt: YESTERDAY.toISOString(),
      };
      storage.setItem(STORAGE_KEYS.fx, JSON.stringify(staleSnapshot));

      const fetcher = makeFailingFetcher();
      const repo = createFxRepository({ storage, fetcher, now: () => TODAY });

      const result = await repo.getCurrent();

      expect(result).toEqual(staleSnapshot);
    });

    it('throws FxUnavailableError when no cache exists and fetch fails', async () => {
      const fetcher = makeFailingFetcher();
      const repo = createFxRepository({ storage, fetcher, now: () => TODAY });

      await expect(repo.getCurrent()).rejects.toThrow(FxUnavailableError);
    });
  });

  describe('refresh', () => {
    it('always fetches even when the cache is fresh', async () => {
      const cachedSnapshot: FxRateSnapshot = {
        base: 'USD',
        rates: { VND: 24_000, USD: 1 },
        fetchedAt: TODAY.toISOString(),
      };
      storage.setItem(STORAGE_KEYS.fx, JSON.stringify(cachedSnapshot));

      const fetcher = makeFetcher();
      const repo = createFxRepository({ storage, fetcher, now: () => TODAY });

      const result = await repo.refresh();

      expect(fetcher).toHaveBeenCalledOnce();
      expect(result).toEqual(MOCK_SNAPSHOT);
    });

    it('updates the cached snapshot after a forced fetch', async () => {
      const fetcher = makeFetcher();
      const repo = createFxRepository({ storage, fetcher, now: () => TODAY });

      await repo.refresh();

      const stored = JSON.parse(storage.getItem(STORAGE_KEYS.fx)!);
      expect(stored).toEqual(MOCK_SNAPSHOT);
    });
  });
});
