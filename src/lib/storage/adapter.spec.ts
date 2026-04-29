import { describe, it, expect, beforeEach } from 'vitest';
import { createStorageAdapter } from './adapter';
import { StorageQuotaExceededError } from './errors';

/**
 * Minimal in-memory Storage implementation used across all tests.
 * Each test gets a fresh instance via beforeEach so there is no bleed between cases.
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

  /** Expose raw map for assertions in tests. */
  rawEntries(): Record<string, string> {
    return Object.fromEntries(this.store);
  }
}

describe('createStorageAdapter', () => {
  let fake: FakeStorage;

  beforeEach(() => {
    fake = new FakeStorage();
  });

  describe('read', () => {
    it('returns the default value when the key is missing', () => {
      const adapter = createStorageAdapter(fake);
      expect(adapter.read('missing', [])).toEqual([]);
    });

    it('returns the parsed value when the key holds valid JSON', () => {
      fake.setItem('myKey', JSON.stringify({ x: 1 }));
      const adapter = createStorageAdapter(fake);
      expect(adapter.read('myKey', null)).toEqual({ x: 1 });
    });

    it('returns the default value and renames the key when JSON is malformed', () => {
      const today = new Date().toISOString().slice(0, 10);
      fake.setItem('myKey', 'not-valid-json{{{');
      const adapter = createStorageAdapter(fake);

      const result = adapter.read('myKey', 'fallback');

      expect(result).toBe('fallback');
      expect(fake.getItem('myKey')).toBeNull();
      expect(fake.getItem(`myKey.broken-${today}`)).toBe('not-valid-json{{{');
    });
  });

  describe('write', () => {
    it('round-trips a value via write then read', () => {
      const adapter = createStorageAdapter(fake);
      const value = { id: 'abc', amount: 1000 };
      adapter.write('myKey', value);
      expect(adapter.read('myKey', null)).toEqual(value);
    });

    it('throws StorageQuotaExceededError when setItem throws a quota error', () => {
      const quotaStorage = new FakeStorage();
      quotaStorage.setItem = () => {
        const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
        throw err;
      };
      const adapter = createStorageAdapter(quotaStorage);
      expect(() => adapter.write('anyKey', { data: 'big' })).toThrow(
        StorageQuotaExceededError,
      );
    });

    it('re-throws non-quota errors unchanged', () => {
      const badStorage = new FakeStorage();
      badStorage.setItem = () => {
        throw new TypeError('unexpected error');
      };
      const adapter = createStorageAdapter(badStorage);
      expect(() => adapter.write('anyKey', {})).toThrow(TypeError);
    });
  });

  describe('remove', () => {
    it('removes an existing key', () => {
      fake.setItem('gone', '"value"');
      const adapter = createStorageAdapter(fake);
      adapter.remove('gone');
      expect(fake.getItem('gone')).toBeNull();
    });

    it('is a no-op when the key is missing', () => {
      const adapter = createStorageAdapter(fake);
      expect(() => adapter.remove('neverExisted')).not.toThrow();
    });
  });
});
