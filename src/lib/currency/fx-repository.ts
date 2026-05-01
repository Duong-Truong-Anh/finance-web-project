import { createStorageAdapter } from '../storage/adapter';
import { STORAGE_KEYS } from '../storage/keys';
import type { FxRateSnapshot } from './types';

export class FxUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('FX rates are unavailable');
    this.name = 'FxUnavailableError';
    if (cause instanceof Error) this.cause = cause;
  }
}

export interface FxRepository {
  getCurrent(): Promise<FxRateSnapshot>;
  refresh(): Promise<FxRateSnapshot>;
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function createFxRepository(opts?: {
  storage?: Storage;
  fetcher?: typeof fetch;
  now?: () => Date;
}): FxRepository {
  const adapter = createStorageAdapter(opts?.storage);
  const fetcher = opts?.fetcher ?? fetch;
  const now = opts?.now ?? (() => new Date());

  async function fetchFresh(): Promise<FxRateSnapshot> {
    const res = await fetcher('/api/fx/latest');
    if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`);
    return (await res.json()) as FxRateSnapshot;
  }

  return {
    async getCurrent(): Promise<FxRateSnapshot> {
      const cached = adapter.read<FxRateSnapshot | null>(STORAGE_KEYS.fx, null);

      if (cached !== null) {
        const cachedDate = new Date(cached.fetchedAt);
        if (isSameUtcDay(cachedDate, now())) {
          return cached;
        }
        // Stale — try to refresh; on failure, return stale cache (graceful degradation)
        try {
          const fresh = await fetchFresh();
          adapter.write(STORAGE_KEYS.fx, fresh);
          return fresh;
        } catch {
          return cached;
        }
      }

      // No cache — must fetch; throw FxUnavailableError on failure
      try {
        const fresh = await fetchFresh();
        adapter.write(STORAGE_KEYS.fx, fresh);
        return fresh;
      } catch (cause) {
        throw new FxUnavailableError(cause);
      }
    },

    async refresh(): Promise<FxRateSnapshot> {
      const fresh = await fetchFresh();
      adapter.write(STORAGE_KEYS.fx, fresh);
      return fresh;
    },
  };
}
