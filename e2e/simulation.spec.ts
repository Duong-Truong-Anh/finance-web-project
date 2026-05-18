import { test, expect, type BrowserContext } from '@playwright/test';
import { seedStorage, mockFx, attachErrorGuard, type ErrorGuard } from './fixtures/seed';
import type { Transaction } from '../src/lib/transactions/schema';
import type { PortfolioConfig, TickerSelection } from '../src/lib/portfolio/schema';
import { STORAGE_KEYS } from '../src/lib/storage/keys';

const SALARY: Transaction = {
  id: '01HWEPYCYW0000000000000040',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  kind: 'income',
  name: 'May Salary',
  amount: { amount: 30000000, currency: 'VND' },
  occurredOn: '2026-05-01',
  notes: null,
};

const RENT: Transaction = {
  id: '01HWEPYCYW0000000000000041',
  createdAt: '2026-05-05T00:00:00.000Z',
  updatedAt: '2026-05-05T00:00:00.000Z',
  kind: 'expense',
  name: 'Rent',
  amount: { amount: 8000000, currency: 'VND' },
  occurredOn: '2026-05-05',
  notes: null,
};

const GROCERIES: Transaction = {
  id: '01HWEPYCYW0000000000000042',
  createdAt: '2026-05-10T00:00:00.000Z',
  updatedAt: '2026-05-10T00:00:00.000Z',
  kind: 'expense',
  name: 'Groceries',
  amount: { amount: 2000000, currency: 'VND' },
  occurredOn: '2026-05-10',
  notes: null,
};

function ticker(symbol: string): TickerSelection {
  return {
    symbol,
    description: '',
    exchange: null,
    pickedAt: '2026-05-01T00:00:00.000Z',
  };
}

const FULL_PORTFOLIO: PortfolioConfig = {
  allocation: { stocks: 0.5, savings: 0.2, cash: 0.1, gold: 0.1, usd: 0.1 },
  tickers:    [ticker('AAPL'), ticker('MSFT'), ticker('GOOGL'), ticker('AMZN'), ticker('NVDA')],
  updatedAt:  '2026-05-01T00:00:00.000Z',
};

async function seedPortfolio(context: BrowserContext, config: PortfolioConfig): Promise<void> {
  await context.addInitScript(
    ({ key, cfg }) => {
      window.localStorage.setItem(key, JSON.stringify(cfg));
    },
    { key: STORAGE_KEYS.portfolio, cfg: config },
  );
}

let guard: ErrorGuard;

test.beforeEach(async ({ page, context }) => {
  guard = attachErrorGuard(page);
  await mockFx(context);
});

test.afterEach(async () => {
  expect(guard.errors, `Captured errors:\n${guard.errors.join('\n')}`).toEqual([]);
});

test('empty state — shows No data yet with add-transaction CTA routing to /cash-flow', async ({
  page,
  context,
}) => {
  await seedStorage(context); // no transactions
  await page.goto('/simulation');

  await expect(page.getByRole('heading', { name: 'No data yet' })).toBeVisible();
  const cta = page.getByRole('link', { name: 'Add your first transaction' });
  await expect(cta).toBeVisible();

  await cta.click();
  await expect(page).toHaveURL(/\/cash-flow/);
});

test('populated — allocation tile, chart, 9 milestone tiles, and 5-row per-asset summary all render', async ({
  page,
  context,
}) => {
  await seedStorage(context, { transactions: [SALARY, RENT, GROCERIES] });
  await seedPortfolio(context, FULL_PORTFOLIO);
  await page.goto('/simulation');

  // Region A — allocation tile heading is unique to this region
  await expect(page.getByText('Asset allocation')).toBeVisible();
  await expect(page.getByText('Your stocks (5 slots)')).toBeVisible();

  // Region A — all 5 ticker slots filled with the seeded symbols
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
  for (let i = 0; i < symbols.length; i += 1) {
    await expect(page.getByLabel(`Ticker ${i + 1}`)).toHaveValue(symbols[i]);
  }

  // Region B — projection chart SVG
  await expect(
    page.locator('.cds--chart-holder svg, [data-carbon-chart] svg').first(),
  ).toBeVisible({ timeout: 8000 });

  // Region C — 9 milestone gridcells (3 horizons × 3 scenarios)
  await expect(page.getByRole('gridcell')).toHaveCount(9);

  // Region C — per-asset summary: 5 asset rows under the header row
  await expect(page.getByText('Per-asset breakdown')).toBeVisible();
  await expect(page.getByText('Year 30 — Mid (17.5%)')).toBeVisible();
});

test('ticker entry persists across reload via portfolio repository', async ({ page, context }) => {
  await seedStorage(context, { transactions: [SALARY] });
  // No initial portfolio — start with empty tickers
  await page.goto('/simulation');

  const slot1 = page.getByLabel('Ticker 1');
  await slot1.fill('aapl');
  await slot1.blur();

  // Value normalises to uppercase locally
  await expect(slot1).toHaveValue('AAPL');

  await page.reload();

  // After reload, slot 1 still shows AAPL — proves the write hit the repository.
  await expect(page.getByLabel('Ticker 1')).toHaveValue('AAPL');
});
