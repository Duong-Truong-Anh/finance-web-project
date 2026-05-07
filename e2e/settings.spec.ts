import { test, expect } from '@playwright/test';
import { seedStorage, mockFx, attachErrorGuard, type ErrorGuard } from './fixtures/seed';
import { STORAGE_KEYS } from '../src/lib/storage/keys';

let guard: ErrorGuard;

test.beforeEach(async ({ page, context }) => {
  guard = attachErrorGuard(page);
  await mockFx(context);
});

test.afterEach(async () => {
  expect(guard.errors, `Captured errors:\n${guard.errors.join('\n')}`).toEqual([]);
});

test('renders with default values on empty storage', async ({ page, context }) => {
  await seedStorage(context); // empty transactions, default theme/currency
  await page.goto('/settings');

  // Display currency: VND selected by default
  const vndRadio = page.getByRole('radio', { name: /VND/ });
  await expect(vndRadio).toBeChecked();

  // Theme: g90 selected by default
  const g90Radio = page.getByRole('radio', { name: /g90/ });
  await expect(g90Radio).toBeChecked();

  // Finnhub key: empty
  const keyInput = page.getByLabel('Finnhub key');
  await expect(keyInput).toHaveValue('');

  // Auto-refresh toggle: on by default
  const toggle = page.getByRole('checkbox', { name: /Refresh automatically/i });
  await expect(toggle).toBeChecked();
});

test('currency change persists across reload', async ({ page, context }) => {
  await seedStorage(context);
  await page.goto('/settings');

  // Switch to USD via the Settings page radio
  await page.getByRole('radio', { name: /USD/ }).click();

  // Header should reflect the new currency
  await expect(page.getByRole('button', { name: /Display currency: USD/ })).toBeVisible();

  // Reload — the cookie written by the repository's set() should persist the choice
  await page.reload();

  await expect(page.getByRole('radio', { name: /USD/ })).toBeChecked();
  await expect(page.getByRole('button', { name: /Display currency: USD/ })).toBeVisible();
});

test('reset flow: confirm button gated on exact "RESET" text, clears storage on confirm', async ({
  page,
  context,
}) => {
  await seedStorage(context, { transactions: [] });

  // Seed some settings so there's something to reset
  await context.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    {
      key: STORAGE_KEYS.settings,
      value: JSON.stringify({
        displayCurrency: 'USD',
        theme: 'g100',
        finnhubKey: null,
        fxAutoRefresh: true,
        schemaVersion: 1,
      }),
    },
  );

  await page.goto('/settings');

  // Open the Reset modal
  await page.getByRole('button', { name: 'Reset all data' }).click();

  // Confirm button should be disabled with empty input
  const confirmBtn = page.getByRole('button', { name: /^Reset$/ }).last();
  await expect(confirmBtn).toBeDisabled();

  // Type wrong text — still disabled
  await page.getByTestId('reset-confirm-input').fill('reset');
  await expect(confirmBtn).toBeDisabled();

  // Type exact "RESET" — now enabled
  await page.getByTestId('reset-confirm-input').fill('RESET');
  await expect(confirmBtn).toBeEnabled();

  // Confirm — should navigate away and clear storage
  await confirmBtn.click();

  // After reset, expect navigation to / and localStorage cleared
  await page.waitForURL('/');
  const storageLength = await page.evaluate(() => window.localStorage.length);
  expect(storageLength).toBe(0);
});
