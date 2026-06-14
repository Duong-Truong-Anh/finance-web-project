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

  // Milestone hero renders the 30-year projection (waypoints + CTA), resolved (no em-dash placeholder)
  const hero = page.getByRole('region', { name: '30-year projection' });
  await expect(hero).toBeVisible();
  await expect(hero).toContainText('On the way', { timeout: 8000 });
  await expect(hero.getByRole('link', { name: /See the full projection/ })).toBeVisible();
  await expect(hero).not.toContainText('—');

  // All three reframed KPI tile labels must be visible (exact: the helper copy
  // also contains "this month", which trips strict mode on a substring match)
  await expect(page.getByText('This month', { exact: true })).toBeVisible();
  await expect(page.getByText('Contribution progress', { exact: true })).toBeVisible();
  await expect(page.getByText('Growth so far', { exact: true })).toBeVisible();

  // Projection chart SVG should be present
  await expect(page.locator('.cds--chart-holder svg, [data-carbon-chart] svg').first()).toBeVisible({ timeout: 8000 });

  // Recent-5 table shows at least 3 rows (we seeded 3)
  const tableRows = page.getByRole('row');
  // header row + 3 data rows = at least 4 rows total
  await expect(tableRows).toHaveCount(4);
});

test('milestone hero — renders the year-30 mid value as a real amount', async ({
  page,
  context,
}) => {
  // USD display so the rendered value carries a "$"; assert the hero resolves to a
  // concrete amount (not the "—" loading placeholder) and shows the 10y/20y waypoints.
  await seedStorage(context, { transactions: [VND_INCOME], currency: 'USD' });
  await page.goto('/');

  const hero = page.getByRole('region', { name: '30-year projection' });
  await expect(hero).toBeVisible();
  await expect(hero).toContainText('$', { timeout: 8000 });
  await expect(hero).not.toContainText('—');
  await expect(hero).toContainText('In 10 years');
  await expect(hero).toContainText('In 20 years');
});

test("today's value — anchor-month data renders non-zero, not $0.00", async ({
  page,
  context,
}) => {
  // Regression for the off-by-one: data starting in the CURRENT calendar month gives
  // monthIndex === 0. Reading series[0] (always exactly 0) rendered $0.00 in all three
  // today's-value tiles. The fix reads series[offset + 1]. Derive YYYY-MM at test time
  // so this is deterministic regardless of run date; use day 01 to stay safely in-month.
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthSalary: Transaction = {
    id: '01HWEPYCYW0000000000000040',
    createdAt: `${ym}-01T00:00:00.000Z`,
    updatedAt: `${ym}-01T00:00:00.000Z`,
    kind: 'income',
    name: 'This Month Salary',
    amount: { amount: 30000000, currency: 'VND' },
    occurredOn: `${ym}-01`,
    notes: null,
  };

  // USD display reproduces the exact reported symptom ($0.00) when the bug is present.
  await seedStorage(context, { transactions: [thisMonthSalary], currency: 'USD' });
  await page.goto('/');

  // The "Growth so far" tile carries today's mid value in its sub-line
  // ("Value $X · Contributed $Y"); series[0] (always 0) would surface as $0.00 there.
  const growthTile = page
    .locator('.cds--tile--clickable')
    .filter({ hasText: 'Growth so far' });
  await expect(growthTile).toBeVisible();

  // Wait for the projection to resolve (USD value rendered), then assert it is neither
  // the $0.00 bug nor the em-dash loading placeholder.
  await expect(growthTile).toContainText('$', { timeout: 8000 });
  await expect(growthTile).not.toContainText('$0.00');
  await expect(growthTile).not.toContainText('—');
});

test('currency reflow — Contributed tile value changes when display currency toggles', async ({
  page,
  context,
}) => {
  await seedStorage(context, { transactions: [VND_INCOME] });
  await page.goto('/');

  // Capture the initial Contribution progress tile text (VND)
  const contributedTile = page
    .locator('.cds--tile--clickable')
    .filter({ hasText: 'Contribution progress' });
  await expect(contributedTile).toBeVisible();
  const vndText = await contributedTile.textContent();

  // Toggle to USD via the header currency button
  await page.getByRole('button', { name: /Display currency: VND/ }).click();
  await page.locator('label', { hasText: 'USD – US Dollar' }).click();

  // After reflow, the contributed value should change to a USD amount
  await expect(contributedTile).not.toContainText(vndText ?? '');
  await expect(contributedTile).toContainText('$');
});
