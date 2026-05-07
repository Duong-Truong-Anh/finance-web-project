import { test, expect } from '@playwright/test';
import { seedStorage, mockFx, attachErrorGuard, type ErrorGuard } from './fixtures/seed';
import type { Transaction } from '../src/lib/transactions/schema';

// Three transactions across 2 months (1 income, 2 expenses)
const SALARY: Transaction = {
  id: '01HWEPYCYW0000000000000030',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  kind: 'income',
  name: 'May Salary',
  amount: { amount: 18000000, currency: 'VND' },
  occurredOn: '2026-05-01',
  notes: null,
};

const RENT: Transaction = {
  id: '01HWEPYCYW0000000000000031',
  createdAt: '2026-05-05T00:00:00.000Z',
  updatedAt: '2026-05-05T00:00:00.000Z',
  kind: 'expense',
  name: 'Rent',
  amount: { amount: 5500000, currency: 'VND' },
  occurredOn: '2026-05-05',
  notes: null,
};

const GROCERIES: Transaction = {
  id: '01HWEPYCYW0000000000000032',
  createdAt: '2026-04-15T00:00:00.000Z',
  updatedAt: '2026-04-15T00:00:00.000Z',
  kind: 'expense',
  name: 'Groceries',
  amount: { amount: 800000, currency: 'VND' },
  occurredOn: '2026-04-15',
  notes: null,
};

// 50 000 000 VND income for currency reflow test
const VND_INCOME: Transaction = {
  id: '01HWEPYCYW0000000000000033',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  kind: 'income',
  name: 'VND Income',
  amount: { amount: 50000000, currency: 'VND' },
  occurredOn: '2026-05-01',
  notes: null,
};

let guard: ErrorGuard;

test.beforeEach(async ({ page, context }) => {
  guard = attachErrorGuard(page);
  await mockFx(context);
});

test.afterEach(async () => {
  expect(guard.errors, `Captured errors:\n${guard.errors.join('\n')}`).toEqual([]);
});

test('empty state — shows No data yet with add-transaction button', async ({ page, context }) => {
  await seedStorage(context); // empty transactions
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'No data yet' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add a transaction' })).toBeVisible();
  await expect(page.locator('.cds--tile--clickable')).toHaveCount(0);

  await page.getByRole('link', { name: 'Add a transaction' }).click();
  await expect(page).toHaveURL(/\/cash-flow/);
});

test('populated dashboard — KPI tiles, chart, and recent-5 table render', async ({
  page,
  context,
}) => {
  await seedStorage(context, { transactions: [SALARY, RENT, GROCERIES] });
  await page.goto('/');

  // All four KPI tile labels must be visible
  await expect(page.getByText('This month')).toBeVisible();
  await expect(page.getByText('Contributed')).toBeVisible();
  await expect(page.getByText("Today's value (mid)")).toBeVisible();
  await expect(page.getByText('In 30 years (mid)')).toBeVisible();

  // Projection chart SVG should be present
  await expect(page.locator('.cds--chart-holder svg, [data-carbon-chart] svg').first()).toBeVisible({ timeout: 8000 });

  // Recent-5 table shows at least 3 rows (we seeded 3)
  const tableRows = page.getByRole('row');
  // header row + 3 data rows = at least 4 rows total
  await expect(tableRows).toHaveCount(4);
});

test('currency reflow — Contributed tile value changes when display currency toggles', async ({
  page,
  context,
}) => {
  await seedStorage(context, { transactions: [VND_INCOME] });
  await page.goto('/');

  // Capture the initial Contributed tile text (VND)
  const contributedTile = page.locator('.cds--tile--clickable').filter({ hasText: 'Contributed' });
  await expect(contributedTile).toBeVisible();
  const vndText = await contributedTile.textContent();

  // Toggle to USD via the header currency button
  await page.getByRole('button', { name: /Display currency: VND/ }).click();
  await page.locator('label', { hasText: 'USD – US Dollar' }).click();

  // After reflow, Contributed tile should show a different value
  await expect(contributedTile).not.toContainText(vndText ?? '');
  await expect(contributedTile).toContainText('$');
});
