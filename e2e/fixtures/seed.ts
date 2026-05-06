import type { BrowserContext, Page } from '@playwright/test';
import type { Transaction } from '../../src/lib/transactions/schema';
import type { FxRateSnapshot } from '../../src/lib/currency/types';
import { STORAGE_KEYS } from '../../src/lib/storage/keys';

export const TX_KEY = STORAGE_KEYS.transactions;
const FX_KEY = STORAGE_KEYS.fx;

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

export type ErrorGuard = { errors: string[] };

/**
 * Capture page errors and console errors so transient render bugs (e.g. invalid
 * React children that self-resolve on the next render) don't slip past assertions
 * that wait for stable DOM. Call in beforeEach; assert the array is empty in afterEach.
 */
export function attachErrorGuard(page: Page): ErrorGuard {
  const guard: ErrorGuard = { errors: [] };
  page.on('pageerror', (err) => guard.errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') guard.errors.push(`console.error: ${msg.text()}`);
  });
  return guard;
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
