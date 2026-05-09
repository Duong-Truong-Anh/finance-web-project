import { defineConfig, devices } from '@playwright/test';

// Separate config for on-demand chaos runs.
// playwright.config.ts excludes chaos.spec.ts via testIgnore; testIgnore
// applies even to explicit file paths in Playwright 1.49, so a dedicated
// config is needed to bypass it.
export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/chaos.spec.ts'],
  timeout: 120_000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
  },
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
