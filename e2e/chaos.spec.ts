import { test, expect } from '@playwright/test';
import { seedStorage, mockFx, attachErrorGuard, type ErrorGuard } from './fixtures/seed';
import { unleashChaos } from './fixtures/gremlins';
import type { Transaction } from '../src/lib/transactions/schema';

const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: '01HWEPYCYW0000000000000001',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    kind: 'expense',
    name: 'Coffee',
    amount: { amount: 30000, currency: 'VND' },
    occurredOn: '2026-04-01',
    notes: null,
  },
  {
    id: '01HWEPYCYW0000000000000002',
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
    kind: 'income',
    name: 'Salary',
    amount: { amount: 20000000, currency: 'VND' },
    occurredOn: '2026-04-02',
    notes: null,
  },
  {
    id: '01HWEPYCYW0000000000000003',
    createdAt: '2026-04-03T00:00:00.000Z',
    updatedAt: '2026-04-03T00:00:00.000Z',
    kind: 'expense',
    name: 'Rent',
    amount: { amount: 5000000, currency: 'VND' },
    occurredOn: '2026-04-03',
    notes: 'Monthly',
  },
];

let guard: ErrorGuard;

const ROUTES = ['/', '/cash-flow', '/settings', '/simulation', '/reports'] as const;

test.describe('chaos', () => {
  test.beforeEach(async ({ page, context }) => {
    guard = attachErrorGuard(page);
    await mockFx(context);
    await seedStorage(context, { transactions: SEED_TRANSACTIONS });
  });

  test.afterEach(async () => {
    expect(guard.errors, `Captured errors:\n${guard.errors.join('\n')}`).toEqual([]);
  });

  for (const route of ROUTES) {
    test(`${route} survives 150 random interactions`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await unleashChaos(page, { count: 150 });
    });
  }
});
