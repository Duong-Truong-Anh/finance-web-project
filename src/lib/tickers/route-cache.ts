import { createHash } from 'node:crypto';

export const MAX_CACHE_SIZE = 100;

export type RouteCache<T> = {
  keyFor: (apiKey: string, identifier: string) => string;
  read: (key: string) => T | null;
  write: (key: string, response: T, ttlMs: number) => void;
  dispose: () => void;
};

export function createRouteCache<T>(): RouteCache<T> {
  const cache = new Map<string, { response: T; expiresAt: number }>();

  return {
    keyFor(apiKey, identifier) {
      const hash = createHash('sha256').update(apiKey).digest('hex').slice(0, 16);
      return `${hash}:${identifier.toLowerCase()}`;
    },
    read(key) {
      const entry = cache.get(key);
      if (!entry) return null;
      if (entry.expiresAt <= Date.now()) {
        cache.delete(key);
        return null;
      }
      return entry.response;
    },
    write(key, response, ttlMs) {
      if (cache.size >= MAX_CACHE_SIZE) {
        // FIFO eviction: Map iteration order is insertion order, so the
        // first key is the oldest. Good enough for a 100-entry window;
        // LRU's read-time bookkeeping would not buy anything at this scale.
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
      cache.set(key, { response, expiresAt: Date.now() + ttlMs });
    },
    dispose() {
      cache.clear();
    },
  };
}
