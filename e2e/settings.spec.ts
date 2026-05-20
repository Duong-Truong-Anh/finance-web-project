import { test, expect } from '@playwright/test';
import { seedStorage, mockFx, mockTickerSearch, attachErrorGuard, type ErrorGuard } from './fixtures/seed';
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

  // Auto-refresh toggle: on by default (Carbon's Toggle component uses role="switch")
  const toggle = page.getByRole('switch', { name: /Refresh automatically/i });
  await expect(toggle).toBeChecked();
});

test('currency change persists across reload', async ({ page, context }) => {
  await seedStorage(context);
  await page.goto('/settings');

  // Switch to USD via the Settings page radio label (scoped to avoid clicking the hidden header popover switcher)
  await page.getByRole('group', { name: 'Display currency' }).locator('label', { hasText: 'USD' }).click();

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
  // Opt out of the transactions initScript so the post-reset navigation
  // (window.location.href = '/') can't rewrite the transactions key and mask a
  // broken reset. Cookies + FX still seed normally. Settings has no initScript
  // here either, so the storage.settings === null assertion remains meaningful.
  await seedStorage(context, { seedTransactions: false });
  await page.goto('/settings');

  await page.evaluate(
    ({ txKey, txs, settingsKey, settings }) => {
      window.localStorage.setItem(txKey, JSON.stringify(txs));
      window.localStorage.setItem(settingsKey, JSON.stringify(settings));
    },
    {
      txKey: STORAGE_KEYS.transactions,
      txs: [
        {
          id: '01ARRW3H6B29ASJRX6AWR0VJ31',
          kind: 'income',
          name: 'Salary',
          amount: { amount: 5000000, currency: 'VND' },
          occurredOn: '2026-05-15',
          notes: null,
          createdAt: '2026-05-15T00:00:00.000Z',
          updatedAt: '2026-05-15T00:00:00.000Z',
        },
      ],
      settingsKey: STORAGE_KEYS.settings,
      settings: {
        displayCurrency: 'USD',
        theme: 'g100',
        finnhubKey: 'test-key-123',
        fxAutoRefresh: true,
        schemaVersion: 1,
      },
    },
  );

  // Open the Reset modal
  await page.getByRole('button', { name: 'Reset all data' }).click();

  // Scope the confirm button to the dialog so we don't match the trigger button.
  const dialog = page.getByRole('dialog', { name: /Reset all data\?/ });
  const confirmBtn = dialog.getByRole('button', { name: /Reset/ });
  await expect(confirmBtn).toBeDisabled();

  // Type wrong text — still disabled
  await page.getByTestId('reset-confirm-input').fill('reset');
  await expect(confirmBtn).toBeDisabled();

  // Type exact "RESET" — now enabled
  await page.getByTestId('reset-confirm-input').fill('RESET');
  await expect(confirmBtn).toBeEnabled();

  // Confirm — should navigate away and clear storage
  await confirmBtn.click();

  // After reset, expect navigation to /
  await page.waitForURL('/');

  // Verify that customized settings and transactions were reset/cleared. Pass the
  // storage keys in as arguments since page.evaluate runs in browser context where
  // STORAGE_KEYS isn't directly importable.
  const storage = await page.evaluate(
    (keys) => ({
      txs: window.localStorage.getItem(keys.txs),
      settings: window.localStorage.getItem(keys.settings),
    }),
    { txs: STORAGE_KEYS.transactions, settings: STORAGE_KEYS.settings },
  );

  // With seedTransactions: false, no initScript rewrites the transactions key,
  // so a passing assertion here is real evidence that the reset action cleared it.
  expect(storage.txs).toBeNull();
  expect(storage.settings).toBeNull();
});

test('theme change applies immediately without page reload', async ({ page, context }) => {
  await seedStorage(context);
  await page.goto('/settings');

  // Click theme labels to avoid pointer event interception
  await page.locator('label', { hasText: 'g100 – Darker' }).click();
  await expect(page.locator('html')).toHaveClass(/cds--g100/);

  await page.locator('label', { hasText: 'White – Light' }).click();
  await expect(page.locator('html')).toHaveClass(/cds--white/);
});

test('test connection: surfaces success toast when Finnhub returns ok', async ({ page, context }) => {
  await seedStorage(context);
  await context.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    {
      key: STORAGE_KEYS.settings,
      value: JSON.stringify({
        displayCurrency: 'VND',
        theme: 'g90',
        finnhubKey: 'valid-key',
        fxAutoRefresh: true,
        schemaVersion: 1,
      }),
    },
  );
  await mockTickerSearch(context, {
    ok: true,
    results: [{ symbol: 'AAPL', description: 'Apple Inc.', exchange: null, type: 'Common Stock' }],
  });

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Test connection' }).click();

  await expect(page.getByText('Connected')).toBeVisible();
  await expect(page.getByText('Live ticker search is working.')).toBeVisible();
});

test('test connection: surfaces specific error toast for invalid key', async ({ page, context }) => {
  await seedStorage(context);
  await context.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    {
      key: STORAGE_KEYS.settings,
      value: JSON.stringify({
        displayCurrency: 'VND',
        theme: 'g90',
        finnhubKey: 'bad-key',
        fxAutoRefresh: true,
        schemaVersion: 1,
      }),
    },
  );
  await mockTickerSearch(context, { ok: false, error: 'invalid-key' });

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Test connection' }).click();

  await expect(page.getByText('Connection failed')).toBeVisible();
  await expect(page.getByText(/Finnhub rejected this key/)).toBeVisible();
});
