import type { BrowserContext } from '@playwright/test';
import type { Transaction } from '../../src/lib/transactions/schema';
import type { FxRateSnapshot } from '../../src/lib/currency/types';

// Storage keys must match STORAGE_KEYS in src/lib/storage/keys.ts exactly.
// namespace = 'flowstate:v1:', keys = 'transactions' and 'fx'.
const TX_KEY = 'flowstate:v1:transactions';
const FX_KEY = 'flowstate:v1:fx';

export const FX_SNAPSHOT: FxRateSnapshot = {
  base: 'USD',
  rates: { VND: 25000, USD: 1 },
  fetchedAt: '2026-05-01T00:00:00.000Z',
};

/**
 * Seed LocalStorage before the page loads. addInitScript runs on every
 * navigation in the context. Call seedStorage before page.goto().
 */
export async function seedStorage(
  context: BrowserContext,
  opts: {
    transactions?: Transaction[];
    theme?: 'g90' | 'g100' | 'white';
    currency?: 'VND' | 'USD';
  } = {},
): Promise<void> {
  const { transactions = [], theme = 'g90', currency = 'VND' } = opts;

  await context.addCookies([
    { name: 'flowstate-theme', value: theme, url: 'http://localhost:3000' },
    { name: 'flowstate-currency', value: currency, url: 'http://localhost:3000' },
  ]);

  await context.addInitScript(
    ({ txs, fx, txKey, fxKey }) => {
      window.localStorage.setItem(txKey, JSON.stringify(txs));
      window.localStorage.setItem(fxKey, JSON.stringify(fx));
    },
    { txs: transactions, fx: FX_SNAPSHOT, txKey: TX_KEY, fxKey: FX_KEY },
  );
}

/**
 * Mock /api/fx/latest so tests never hit open.er-api.com and are deterministic.
 * The FX snapshot date (2026-05-01) is one day stale, so the FX repository
 * always calls the route to refresh — this mock is the authoritative source.
 */
export async function mockFx(context: BrowserContext): Promise<void> {
  await context.route('**/api/fx/latest', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FX_SNAPSHOT),
    }),
  );
}
