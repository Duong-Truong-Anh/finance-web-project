import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { seedStorage, mockFx, TX_KEY } from './fixtures/seed';
import type { Transaction } from '../src/lib/transactions/schema';

const EXPORT_TX: Transaction = {
  id: '01HWEPYCYW0000000000000010',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
  kind: 'income',
  name: 'April salary',
  amount: { amount: 50000000, currency: 'VND' },
  occurredOn: '2026-04-15',
  notes: null,
};

test.beforeEach(async ({ context }) => {
  await mockFx(context);
  await seedStorage(context); // empty seed; each test seeds what it needs
});

test('exports CSV when transactions exist', async ({ page, context }) => {
  await context.addInitScript(
    ({ txs, key }) => window.localStorage.setItem(key, JSON.stringify(txs)),
    { txs: [EXPORT_TX], key: TX_KEY },
  );
  await page.goto('/cash-flow');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^flowstate-cashflow-\d{4}-\d{2}-\d{2}\.csv$/);

  const savePath = test.info().outputPath('export.csv');
  await download.saveAs(savePath);
  const content = await fs.readFile(savePath, 'utf-8');
  expect(content).toContain('April salary');
});

test('imports a valid CSV', async ({ page }) => {
  await page.goto('/cash-flow');

  await page.getByRole('button', { name: 'Import CSV' }).click();

  // FileUploaderDropContainer renders a visually-hidden <input type="file">
  await page.locator('input[type="file"]').setInputFiles('e2e/fixtures/sample-import.csv');

  // Preview text: "2 valid rows" (no error suffix rendered when errors.length === 0)
  await expect(page.getByText(/2 valid rows/)).toBeVisible();

  await page.getByRole('button', { name: 'Import 2 rows' }).click();

  await expect(page.getByRole('button', { name: 'Import 2 rows' })).not.toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: /Salary/ })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: /Rent/ })).toBeVisible();
});

test('shows errors when CSV header is missing a column', async ({ page }) => {
  // Drop "currency" from the header — parseCsv returns early with 1 error at row 1.
  const badCsv = 'date,kind,name,amount,notes\n2026-04-15,income,Salary,50000000,April salary\n2026-04-20,expense,Rent,15000000,\n';
  const badCsvPath = test.info().outputPath('bad.csv');
  await fs.writeFile(badCsvPath, badCsv, 'utf-8');

  await page.goto('/cash-flow');
  await page.getByRole('button', { name: 'Import CSV' }).click();
  await page.locator('input[type="file"]').setInputFiles(badCsvPath);

  // Preview: "0 valid rows, 1 error"
  await expect(page.getByText(/0 valid rows/)).toBeVisible();
  await expect(page.getByText(/1 error/)).toBeVisible();
  // Warning notification subtitle contains "Missing required column"
  await expect(page.getByText(/Missing required column/)).toBeVisible();
  // exact: true avoids matching "Import CSV" button also on the page
  await expect(page.getByRole('button', { name: 'Import', exact: true })).toBeDisabled();
});
