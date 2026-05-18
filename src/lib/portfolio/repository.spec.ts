import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLocalStoragePortfolioRepository,
  DEFAULT_PORTFOLIO_CONFIG,
} from './repository';
import { portfolioConfigSchema, ASSET_ALLOCATION, type PortfolioConfig } from './schema';
import { STORAGE_KEYS } from '../storage/keys';

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

const VALID_CONFIG: PortfolioConfig = {
  allocation: ASSET_ALLOCATION,
  tickers: [
    {
      symbol: 'AAPL',
      description: 'Apple Inc.',
      exchange: 'NASDAQ',
      pickedAt: '2026-05-01T00:00:00.000Z',
    },
  ],
  updatedAt: '2026-05-01T00:00:00.000Z',
};

describe('createLocalStoragePortfolioRepository', () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
  });

  function makeRepo() {
    return createLocalStoragePortfolioRepository({ storage });
  }

  it('get() returns null on empty storage', async () => {
    const repo = makeRepo();
    expect(await repo.get()).toBeNull();
  });

  it('set() persists and get() round-trips the config', async () => {
    const repo = makeRepo();
    await repo.set(VALID_CONFIG);
    const result = await repo.get();
    expect(result).toEqual(VALID_CONFIG);
  });

  it('set() then clear() then get() returns null', async () => {
    const repo = makeRepo();
    await repo.set(VALID_CONFIG);
    await repo.clear();
    expect(await repo.get()).toBeNull();
  });

  it('invalid stored JSON → get() returns null without throwing', async () => {
    storage.setItem(STORAGE_KEYS.portfolio, 'not-valid-json{{{{');
    const repo = makeRepo();
    expect(await repo.get()).toBeNull();
  });

  // Migration: pre-Phase-3.1 records used `ratio: number` instead of `allocation`.
  // The new Zod schema parse-fails on the old shape → get() returns null.
  // Consumer falls back to DEFAULT_PORTFOLIO_CONFIG. No data is destroyed.
  it('migration: old ratio-shaped record → get() returns null (consumer falls back to default)', async () => {
    const legacyRecord = { ratio: 0.40, tickers: [], updatedAt: '2026-05-01T00:00:00.000Z' };
    storage.setItem(STORAGE_KEYS.portfolio, JSON.stringify(legacyRecord));
    const repo = makeRepo();
    expect(await repo.get()).toBeNull();
  });

  it('migration: ratio value outside old range still returns null (schema mismatch, not value mismatch)', async () => {
    const legacyRecord = { ratio: 0.99, tickers: [], updatedAt: '2026-05-01T00:00:00.000Z' };
    storage.setItem(STORAGE_KEYS.portfolio, JSON.stringify(legacyRecord));
    const repo = makeRepo();
    expect(await repo.get()).toBeNull();
  });

  it('allocation with wrong literal values → get() returns null', async () => {
    const tampered = {
      allocation: { stocks: 0.99, savings: 0.01, cash: 0.00, gold: 0.00, usd: 0.00 },
      tickers: [],
      updatedAt: '2026-05-01T00:00:00.000Z',
    };
    storage.setItem(STORAGE_KEYS.portfolio, JSON.stringify(tampered));
    const repo = makeRepo();
    expect(await repo.get()).toBeNull();
  });

  it('DEFAULT_PORTFOLIO_CONFIG parses successfully against the schema', () => {
    const result = portfolioConfigSchema.safeParse(DEFAULT_PORTFOLIO_CONFIG);
    expect(result.success).toBe(true);
  });

  it('DEFAULT_PORTFOLIO_CONFIG.allocation equals ASSET_ALLOCATION', () => {
    expect(DEFAULT_PORTFOLIO_CONFIG.allocation).toEqual(ASSET_ALLOCATION);
  });
});
