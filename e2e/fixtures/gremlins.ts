import type { Page } from '@playwright/test';
import path from 'path';

export interface ChaosOptions {
  count?: number; // Default 150
  delay?: number; // Default 10ms
}

const GREMLINS_BUNDLE = path.resolve(
  process.cwd(),
  'node_modules/gremlins.js/dist/gremlins.min.js',
);

export async function unleashChaos(page: Page, options: ChaosOptions = {}): Promise<void> {
  const { count = 150, delay = 10 } = options;

  // Inject the UMD bundle — exposes window.gremlins in the page context.
  await page.addScriptTag({ path: GREMLINS_BUNDLE });

  try {
    await page.evaluate(
      async ({ count, delay }) => {
        // @ts-expect-error gremlins is injected globally via addScriptTag
        const g = window.gremlins;
        const horde = g.createHorde({
          species: [
            g.species.clicker(),
            g.species.formFiller(),
            g.species.scroller(),
            g.species.typer(),
          ],
          mogwais: [], // Disable all monitors — attachErrorGuard is the source of truth.
          strategies: [
            g.strategies.distribution({
              nb: count,
              delay,
              distribution: [0.4, 0.3, 0.2, 0.1],
            }),
          ],
        });
        await horde.unleash();
      },
      { count, delay },
    );
  } catch (err) {
    // A gremlin click may trigger navigation, destroying the evaluation context.
    // This is expected chaos behavior; attachErrorGuard remains the source of truth.
    if (!(err instanceof Error) || !err.message.includes('Execution context was destroyed')) {
      throw err;
    }
  }
}
