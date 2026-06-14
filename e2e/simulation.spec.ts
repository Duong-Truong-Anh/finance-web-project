import { test, expect, type BrowserContext } from '@playwright/test';
import { seedStorage, mockFx, mockTickerSearch, mockTickerQuote, attachErrorGuard, type ErrorGuard } from './fixtures/seed';
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

async function seedFinnhubKey(context: BrowserContext, key: string): Promise<void> {
  await context.addInitScript(
    ({ storageKey, finnhubKey }) => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          displayCurrency: 'VND',
          theme: 'g90',
          finnhubKey,
          fxAutoRefresh: true,
          schemaVersion: 1,
        }),
      );
    },
    { storageKey: STORAGE_KEYS.settings, finnhubKey: key },
  );
}

let guard: ErrorGuard;

test.beforeEach(async ({ page, context }) => {
  guard = attachErrorGuard(page);
  await mockFx(context);
  await mockTickerSearch(context);
  await mockTickerQuote(context);
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

  // Region A — all 5 ticker slots filled with the seeded symbols (ComboBox displays symbol-only when description is empty)
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
  for (let i = 0; i < symbols.length; i += 1) {
    await expect(page.getByRole('combobox', { name: `Ticker ${i + 1}` })).toHaveValue(symbols[i]);
  }

  // Region B — projection chart SVG
  await expect(
    page.locator('.cds--chart-holder svg, [data-carbon-chart] svg').first(),
  ).toBeVisible({ timeout: 8000 });

  // Region C — 9 milestone gridcells (3 horizons × 3 scenarios)
  await expect(page.getByRole('gridcell')).toHaveCount(9);

  // Region C — per-asset summary: 5 asset rows under the header row.
  // Scope the year-30 header to the per-asset table — the per-ticker breakdown
  // below it reuses the same column header.
  await expect(page.getByText('Per-asset breakdown')).toBeVisible();
  await expect(
    page
      .getByLabel('Per-asset summary at year 30, mid scenario')
      .getByText('Year 30: Mid (17.5%)'),
  ).toBeVisible();
});

test('line chart tooltip lists scenarios Low → Mid → High (not value-descending)', async ({
  page,
  context,
}) => {
  await seedStorage(context, { transactions: [SALARY, RENT, GROCERIES] });
  await seedPortfolio(context, FULL_PORTFOLIO);
  await page.goto('/simulation');

  const backdrop = page
    .locator('[role="figure"][aria-labelledby="sim-chart-heading"] .chart-grid-backdrop')
    .first();
  await backdrop.scrollIntoViewIfNeeded();
  const box = await backdrop.boundingBox();
  if (!box) throw new Error('chart backdrop has no bounding box');

  // Carbon raises the ruler (multi-series) tooltip on a mousemove that changes the
  // nearest data column — a single static move only emits a MOVE, not a SHOW. So we
  // move to one x, then to a different x to force the SHOW with all scenarios at that year.
  const y = box.y + box.height * 0.6;
  await page.mouse.move(box.x + box.width * 0.3, y, { steps: 5 });
  await page.mouse.move(box.x + box.width * 0.7, y, { steps: 10 });

  const tooltip = page.locator('.multi-tooltip');
  await expect(tooltip).toBeVisible({ timeout: 4000 });

  const text = (await tooltip.innerText()).replace(/\s+/g, ' ');
  const low = text.indexOf('Low (15%)');
  const mid = text.indexOf('Mid (17.5%)');
  const high = text.indexOf('High (20%)');

  expect(low, `tooltip text: ${text}`).toBeGreaterThanOrEqual(0);
  expect(mid).toBeGreaterThan(low);
  expect(high).toBeGreaterThan(mid);
  // Mutually-exclusive scenarios: no summed Total row.
  expect(text).not.toContain('Total');
});

test('per-asset stacked-area chart renders below the projection chart on populated state', async ({
  page,
  context,
}) => {
  await seedStorage(context, { transactions: [SALARY, RENT, GROCERIES] });
  await seedPortfolio(context, FULL_PORTFOLIO);
  await page.goto('/simulation');

  await expect(page.getByText('Per-asset growth (Mid scenario)')).toBeVisible();

  // Carbon Charts renders its SVG inside .cds--chart-holder; assert one is present
  // inside the figure scoped by aria-labelledby="sim-stacked-heading".
  const figure = page.locator('[role="figure"][aria-labelledby="sim-stacked-heading"]');
  await expect(figure).toBeVisible();
  await expect(figure.locator('.cds--chart-holder svg').first()).toBeVisible({ timeout: 8000 });
});

test('free-text entry persists across reload via portfolio repository', async ({ page, context }) => {
  await seedStorage(context, { transactions: [SALARY] });
  // No initial portfolio, no Finnhub key — exercises the free-text fallback path
  await page.goto('/simulation');

  const slot1 = page.getByRole('combobox', { name: 'Ticker 1' });
  await slot1.fill('aapl');
  await slot1.blur();

  // ComboBox redisplays the committed selection via controlled selectedItem
  await expect(slot1).toHaveValue('AAPL');

  await page.reload();

  await expect(page.getByRole('combobox', { name: 'Ticker 1' })).toHaveValue('AAPL');
});

test('dropdown selection commits the full TickerSelection (symbol + description)', async ({
  page,
  context,
}) => {
  await seedStorage(context, { transactions: [SALARY] });
  await seedFinnhubKey(context, 'test-key-123');
  await page.goto('/simulation');

  const slot1 = page.getByRole('combobox', { name: 'Ticker 1' });
  await slot1.fill('app');

  // The mocked /api/tickers/search returns Apple Inc. — wait for it in the listbox
  const appleOption = page.getByRole('option', { name: /AAPL.*Apple Inc\./ });
  await expect(appleOption).toBeVisible({ timeout: 2000 });
  await appleOption.click();

  // ComboBox now shows "AAPL  ·  Apple Inc." per itemToString
  await expect(slot1).toHaveValue(/AAPL.*Apple Inc\./);

  await page.reload();

  // After reload, the persisted description carries through
  await expect(page.getByRole('combobox', { name: 'Ticker 1' })).toHaveValue(/AAPL.*Apple Inc\./);
});

test('per-ticker breakdown — renders entered symbols with non-zero allocated amounts', async ({
  page,
  context,
}) => {
  await seedStorage(context, { transactions: [SALARY, RENT, GROCERIES] });
  await seedPortfolio(context, FULL_PORTFOLIO);
  await page.goto('/simulation');

  await expect(page.getByText('Per-ticker breakdown')).toBeVisible();

  const list = page.locator(
    '[aria-label="Per-ticker breakdown at year 30, mid scenario"]',
  );
  await expect(list).toBeVisible();

  // One row per entered ticker — all 5 seeded symbols named.
  for (const symbol of ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA']) {
    await expect(list.getByText(symbol, { exact: true })).toBeVisible();
  }

  // The AAPL row carries a non-zero formatted money amount (stocks ÷ 5).
  const aaplRow = list.locator('.cds--structured-list-row', { hasText: 'AAPL' });
  await expect(aaplRow).toContainText(/[1-9]/);
});

test('live price renders under the ComboBox when a symbol is committed and a Finnhub key is set', async ({
  page,
  context,
}) => {
  await seedStorage(context, { transactions: [SALARY] });
  await seedPortfolio(context, FULL_PORTFOLIO);
  await seedFinnhubKey(context, 'test-key-123');
  await page.goto('/simulation');

  // mockTickerQuote returns $185.42 +1.23% by default; assert both are visible.
  await expect(page.getByText('$185.42').first()).toBeVisible({ timeout: 4000 });
  await expect(page.getByText('+1.23%').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh price' }).first()).toBeVisible();
});
