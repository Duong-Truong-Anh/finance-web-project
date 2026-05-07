import { portfolioConfigSchema, type PortfolioConfig } from './schema';
import { createStorageAdapter } from '../storage/adapter';
import { STORAGE_KEYS } from '../storage/keys';

export interface PortfolioRepository {
  get(): Promise<PortfolioConfig | null>;
  set(config: PortfolioConfig): Promise<void>;
  clear(): Promise<void>;
}

export const DEFAULT_PORTFOLIO_CONFIG: PortfolioConfig = {
  ratio: 0.40,
  tickers: [],
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export function createLocalStoragePortfolioRepository(opts?: {
  storage?: Storage;
}): PortfolioRepository {
  const adapter = createStorageAdapter(opts?.storage ?? globalThis.localStorage);
  const KEY = STORAGE_KEYS.portfolio;

  return {
    async get(): Promise<PortfolioConfig | null> {
      const raw = adapter.read<PortfolioConfig | null>(KEY, null);
      if (raw === null) return null;
      const result = portfolioConfigSchema.safeParse(raw);
      return result.success ? result.data : null;
    },

    async set(config: PortfolioConfig): Promise<void> {
      adapter.write(KEY, config);
    },

    async clear(): Promise<void> {
      adapter.remove(KEY);
    },
  };
}

export const portfolioRepository: PortfolioRepository =
  createLocalStoragePortfolioRepository();
