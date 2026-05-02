import { test, expect } from '@playwright/test';
import { seedStorage, mockFx } from './fixtures/seed';
import type { Transaction } from '../src/lib/transactions/schema';

// 50 000 000 VND income → $2 000.00 USD at the mocked 25 000 VND/USD rate.
const SALARY_TX: Transaction = {
  id: '01HWEPYCYW0000000000000020',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
  kind: 'income',
  name: 'Salary',
  amount: { amount: 50000000, currency: 'VND' },
  occurredOn: '2026-05-01',
  notes: null,
};

test.beforeEach(async ({ context }) => {
  await mockFx(context);
  await seedStorage(context, { transactions: [SALARY_TX] });
});

test('reflows table amounts when display currency changes', async ({ page }) => {
  await page.goto('/cash-flow');

  const row = page.getByRole('row').filter({ hasText: /Salary/ });

  // Initial VND display: 50 000 000 VND in vi-VN locale → "50.000.000 ₫"
  await expect(row).toContainText('50.000.000');
  await expect(row).toContainText('₫');

  // Open the currency switcher popover.
  await page.getByRole('button', { name: /Display currency: VND/ }).click();

  // Carbon's RadioButton has a custom <span> that intercepts pointer events.
  // Clicking the associated <label> is the reliable path.
  await page.locator('label', { hasText: 'USD – US Dollar' }).click();

  // After router.refresh(), the page re-renders with initialCurrency='USD'.
  // 50 000 000 VND / 25 000 = 2 000 USD → en-US format: "$2,000.00"
  await expect(row).toContainText('$2,000.00');

  // Header chip now reflects the new currency.
  await expect(page.getByRole('button', { name: /Display currency: USD/ })).toBeVisible();
});

test('persists currency choice across reload', async ({ page }) => {
  await page.goto('/cash-flow');

  const row = page.getByRole('row').filter({ hasText: /Salary/ });

  // Toggle to USD.
  await page.getByRole('button', { name: /Display currency: VND/ }).click();
  await page.locator('label', { hasText: 'USD – US Dollar' }).click();
  await expect(row).toContainText('$2,000.00');

  // Full reload — writeCookie set flowstate-currency=USD in the browser jar,
  // so the server reads USD from the cookie and renders with USD on the SSR pass.
  await page.reload();

  await expect(page.getByRole('button', { name: /Display currency: USD/ })).toBeVisible();
  await expect(row).toContainText('$2,000.00');
});
