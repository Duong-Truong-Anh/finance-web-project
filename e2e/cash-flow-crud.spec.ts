import { test, expect } from '@playwright/test';
import { seedStorage, mockFx, TX_KEY } from './fixtures/seed';
import type { Transaction } from '../src/lib/transactions/schema';

// Static fixture — a complete Transaction used in edit and delete tests.
const COFFEE_TX: Transaction = {
  id: '01HWEPYCYW0000000000000001',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
  kind: 'expense',
  name: 'Coffee',
  amount: { amount: 30000, currency: 'VND' },
  occurredOn: '2026-04-29',
  notes: null,
};

test.beforeEach(async ({ context }) => {
  await mockFx(context);
  await seedStorage(context); // empty transactions, g90 theme, VND currency
});

test('shows empty state with zero transactions', async ({ page }) => {
  await page.goto('/cash-flow');
  await expect(page.getByText('No transactions yet')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add transaction' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
});

test('adds a VND transaction via the modal', async ({ page }) => {
  await page.goto('/cash-flow');

  await page.getByRole('button', { name: 'Add transaction' }).click();

  // Use exact:true because getByLabel does substring matching and
  // "Vietnamese" (from the VND radio label) contains "name".
  await page.getByLabel('Name', { exact: true }).fill('Coffee');
  await page.getByLabel('Amount').fill('30000');

  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible();
  const row = page.getByRole('row').filter({ hasText: /Coffee/ });
  await expect(row).toBeVisible();
  // 30 000 VND in vi-VN locale: "30.000 ₫"
  await expect(row).toContainText('30.000');
  await expect(row).toContainText('₫');
});

test('edits a transaction', async ({ page, context }) => {
  await context.addInitScript(
    ({ txs, key }) => window.localStorage.setItem(key, JSON.stringify(txs)),
    { txs: [COFFEE_TX], key: TX_KEY },
  );
  await page.goto('/cash-flow');

  // Scope the overflow menu lookup to the Coffee row to avoid relying on
  // Carbon's tooltip-based accessible name computation.
  const coffeeRow = page.getByRole('row').filter({ hasText: /Coffee/ });
  await expect(coffeeRow).toBeVisible();
  await coffeeRow.getByRole('button').click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();

  await page.getByLabel('Name', { exact: true }).fill('Tea');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('row').filter({ hasText: /Tea/ })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: /Coffee/ })).not.toBeVisible();
});

test('deletes a transaction', async ({ page, context }) => {
  await context.addInitScript(
    ({ txs, key }) => window.localStorage.setItem(key, JSON.stringify(txs)),
    { txs: [COFFEE_TX], key: TX_KEY },
  );
  await page.goto('/cash-flow');

  const coffeeRow = page.getByRole('row').filter({ hasText: /Coffee/ });
  await expect(coffeeRow).toBeVisible();
  await coffeeRow.getByRole('button').click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  // DeleteConfirmModal primary button
  await page.getByRole('button', { name: 'Delete' }).click();

  await expect(page.getByText('No transactions yet')).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: /Coffee/ })).not.toBeVisible();
});
