import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLocalStorageSettingsRepository,
  DEFAULT_SETTINGS,
} from './repository';
import { settingsSchema, type Settings } from './schema';
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

const VALID_SETTINGS: Settings = {
  displayCurrency: 'USD',
  theme: 'g100',
  finnhubKey: 'test_key_abc123',
  fxAutoRefresh: false,
  schemaVersion: 1,
};

describe('createLocalStorageSettingsRepository', () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
  });

  function makeRepo() {
    return createLocalStorageSettingsRepository({ storage });
  }

  it('get() returns null on empty storage', async () => {
    const repo = makeRepo();
    expect(await repo.get()).toBeNull();
  });

  it('set() persists and get() round-trips the settings', async () => {
    const repo = makeRepo();
    await repo.set(VALID_SETTINGS);
    const result = await repo.get();
    expect(result).toEqual(VALID_SETTINGS);
  });

  it('set() then clear() then get() returns null', async () => {
    const repo = makeRepo();
    await repo.set(VALID_SETTINGS);
    await repo.clear();
    expect(await repo.get()).toBeNull();
  });

  it('invalid stored JSON → get() returns null without throwing', async () => {
    storage.setItem(STORAGE_KEYS.settings, 'not-valid-json{{{{');
    const repo = makeRepo();
    expect(await repo.get()).toBeNull();
  });

  it('schema-invalid stored value (bad theme) → get() returns null', async () => {
    const invalid = { ...VALID_SETTINGS, theme: 'dark' };
    storage.setItem(STORAGE_KEYS.settings, JSON.stringify(invalid));
    const repo = makeRepo();
    expect(await repo.get()).toBeNull();
  });

  it('DEFAULT_SETTINGS parses successfully against the schema', () => {
    const result = settingsSchema.safeParse(DEFAULT_SETTINGS);
    expect(result.success).toBe(true);
  });
});
