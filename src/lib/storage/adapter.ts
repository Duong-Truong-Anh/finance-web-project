import { StorageQuotaExceededError } from './errors';

export interface StorageAdapter {
  read<T>(key: string, defaultValue: T): T;
  write<T>(key: string, value: T): void;
  remove(key: string): void;
}

function toBrokenKey(key: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${key}.broken-${date}`;
}

export function createStorageAdapter(
  storage: Storage = globalThis.localStorage,
): StorageAdapter {
  return {
    read<T>(key: string, defaultValue: T): T {
      let raw: string | null;
      try {
        raw = storage.getItem(key);
      } catch {
        return defaultValue;
      }

      if (raw === null) {
        return defaultValue;
      }

      try {
        return JSON.parse(raw) as T;
      } catch {
        // Corrupt data: rename the bad key and return default
        try {
          storage.setItem(toBrokenKey(key), raw);
          storage.removeItem(key);
        } catch {
          // Best-effort rename; if even this fails, silently continue
        }
        return defaultValue;
      }
    },

    write<T>(key: string, value: T): void {
      try {
        storage.setItem(key, JSON.stringify(value));
      } catch (err) {
        if (
          err instanceof DOMException &&
          (err.name === 'QuotaExceededError' ||
            err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
            err.code === 22)
        ) {
          throw new StorageQuotaExceededError(key, err);
        }
        throw err;
      }
    },

    remove(key: string): void {
      try {
        storage.removeItem(key);
      } catch {
        // No-op if missing or inaccessible
      }
    },
  };
}
