'use client';
import { useMemo, useState } from 'react';
import {
  Column,
  Grid,
  InlineNotification,
  SkeletonPlaceholder,
  SkeletonText,
} from '@carbon/react';
import { computeProjection } from '@/src/lib/projection';
import type { Currency, FxRateSnapshot } from '@/src/lib/currency/types';
import type { Theme } from '@/src/lib/settings/repository';
import type { TickerSelection } from '@/src/lib/portfolio';
import { useTransactions } from '@/src/features/cash-flow/useTransactions';
import { useFx } from '@/src/features/cash-flow/useFx';
import { usePortfolioConfig } from '@/src/features/dashboard/usePortfolioConfig';
import { useSettings } from '@/src/features/settings/useSettings';
import AllocationTile from './AllocationTile';
import TickerInputTile from './TickerInputTile';
import MilestoneGrid from './MilestoneGrid';
import PerAssetSummary from './PerAssetSummary';
import PerTickerSummary from './PerTickerSummary';
import SimulationEmptyState from './SimulationEmptyState';
import SimulationProjectionChart from '@/src/components/charts/SimulationProjectionChart';
import PerAssetStackedAreaChart from '@/src/components/charts/PerAssetStackedAreaChart';

const IDENTITY_FX: FxRateSnapshot = {
  base: 'USD',
  rates: { VND: 25000, USD: 1 },
  fetchedAt: '1970-01-01T00:00:00.000Z',
};

const TOTAL_TICKER_SLOTS = 5;

function localeFor(currency: Currency): 'vi-VN' | 'en-US' {
  return currency === 'VND' ? 'vi-VN' : 'en-US';
}

function computeNextTickers(
  current: TickerSelection[],
  index: number,
  selection: TickerSelection | null,
): TickerSelection[] {
  const padded: Array<TickerSelection | null> = [...current];
  while (padded.length <= index) padded.push(null);
  padded[index] = selection;
  // Compact so the schema (max 5, contiguous) accepts it.
  return padded.filter((t): t is TickerSelection => t !== null);
}

interface Props {
  initialCurrency: Currency;
  initialTheme: Theme;
}

export default function SimulationPage({ initialCurrency, initialTheme }: Props) {
  const { state: txState } = useTransactions();
  const fxState = useFx();
  const cfgState = usePortfolioConfig();
  const settingsState = useSettings();
  const finnhubKey =
    settingsState.status === 'ready' ? settingsState.settings.finnhubKey : null;

  // Local optimistic ticker state: fixes the blur-race when two slots fire close together.
  const persistedTickers =
    cfgState.status === 'ready' ? cfgState.config.tickers : null;
  const [localTickers, setLocalTickers] = useState<TickerSelection[]>(persistedTickers ?? []);
  const [lastPersisted, setLastPersisted] = useState(persistedTickers);

  // Render-phase sync: hydrate local state when the repo finishes loading or changes externally.
  if (persistedTickers !== lastPersisted) {
    setLastPersisted(persistedTickers);
    if (persistedTickers) setLocalTickers(persistedTickers);
  }

  const fx = fxState.status === 'ready' ? fxState.fx : IDENTITY_FX;
  const locale = localeFor(initialCurrency);

  const projection = useMemo(() => {
    if (txState.status !== 'ready' || cfgState.status !== 'ready') return null;
    return computeProjection({
      transactions: txState.transactions,
      allocation: cfgState.config.allocation,
      displayCurrency: initialCurrency,
      fx,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txState, cfgState, fxState, initialCurrency]);

  function handleSlotCommit(index: number, selection: TickerSelection | null) {
    if (cfgState.status !== 'ready') return;
    const next = computeNextTickers(localTickers, index, selection);
    setLocalTickers(next);
    void cfgState.set({
      ...cfgState.config,
      tickers: next,
      updatedAt: new Date().toISOString(),
    });
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (txState.status === 'loading' || cfgState.status === 'loading') {
    return (
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <h1
            className="cds--type-productive-heading-04"
            style={{ marginBlockEnd: '2rem' /* --cds-spacing-07 */ }}
          >
            Simulation
          </h1>
          <SkeletonText heading width="40%" />
          <SkeletonPlaceholder style={{ width: '100%', height: '440px' }} />
          <SkeletonPlaceholder
            style={{
              width: '100%',
              height: '360px',
              marginBlockStart: '2rem' /* --cds-spacing-07 */,
            }}
          />
        </Column>
      </Grid>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (txState.status === 'error') {
    return (
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <h1
            className="cds--type-productive-heading-04"
            style={{ marginBlockEnd: '2rem' /* --cds-spacing-07 */ }}
          >
            Simulation
          </h1>
          <InlineNotification
            kind="error"
            title="Failed to load transactions"
            subtitle={txState.error.message}
            hideCloseButton
          />
        </Column>
      </Grid>
    );
  }

  if (cfgState.status === 'error') {
    return (
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <h1
            className="cds--type-productive-heading-04"
            style={{ marginBlockEnd: '2rem' /* --cds-spacing-07 */ }}
          >
            Simulation
          </h1>
          <InlineNotification
            kind="error"
            title="Failed to load portfolio"
            subtitle={cfgState.error.message}
            hideCloseButton
          />
        </Column>
      </Grid>
    );
  }

  const { transactions } = txState;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (transactions.length === 0) {
    return (
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <h1
            className="cds--type-productive-heading-04"
            style={{ marginBlockEnd: '2rem' /* --cds-spacing-07 */ }}
          >
            Simulation
          </h1>
          <SimulationEmptyState />
        </Column>
      </Grid>
    );
  }

  if (projection === null) return null;

  const filledCount = localTickers.length;
  const missing = TOTAL_TICKER_SLOTS - filledCount;
  const slotIndices = Array.from({ length: TOTAL_TICKER_SLOTS }, (_, i) => i);

  return (
    <Grid>
      <Column sm={4} md={8} lg={16}>
        <h1
          className="cds--type-productive-heading-04"
          style={{ marginBlockEnd: '2rem' /* --cds-spacing-07 */ }}
        >
          Simulation
        </h1>
      </Column>

      {/* Region A: Configuration */}
      <Column sm={4} md={8} lg={5} style={{ marginBlockEnd: '2rem' /* --cds-spacing-07 */ }}>
        <AllocationTile />
      </Column>

      <Column sm={4} md={8} lg={11} style={{ marginBlockEnd: '2rem' /* --cds-spacing-07 */ }}>
        <p
          className="cds--type-productive-heading-03"
          style={{ marginBlockEnd: '1rem' /* --cds-spacing-05 */ }}
        >
          Your stocks (5 slots)
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '1rem' /* --cds-spacing-05 */,
          }}
        >
          {slotIndices.map((i) => {
            const sel = localTickers[i] ?? null;
            // Re-key on the persisted selection's identity so an external
            // commit (free-text or dropdown) remounts the ComboBox cleanly
            // with the new initialSelectedItem.
            const slotKey = `slot-${i}-${sel ? `${sel.symbol}|${sel.description}` : 'empty'}`;
            return (
              <TickerInputTile
                key={slotKey}
                index={i}
                selection={sel}
                finnhubKey={finnhubKey}
                onCommit={(selection) => handleSlotCommit(i, selection)}
              />
            );
          })}
        </div>
        {missing > 0 && (
          <div style={{ marginBlockStart: '1rem' /* --cds-spacing-05 */ }}>
            <InlineNotification
              kind="info"
              lowContrast
              title={`Add ${missing} more ticker${missing === 1 ? '' : 's'} to complete your portfolio.`}
              hideCloseButton
            />
          </div>
        )}
      </Column>

      {/* Region B: Projection chart */}
      <Column sm={4} md={8} lg={16} style={{ marginBlockEnd: '2rem' /* --cds-spacing-07 */ }}>
        <p
          id="sim-chart-heading"
          className="cds--type-productive-heading-03"
          style={{ marginBlockEnd: '1rem' /* --cds-spacing-05 */ }}
        >
          30-year projection
        </p>
        <div role="figure" aria-labelledby="sim-chart-heading">
          <SimulationProjectionChart
            projection={projection}
            displayCurrency={initialCurrency}
            theme={initialTheme}
          />
        </div>
      </Column>

      {/* Region B (cont.): Per-asset stacked-area chart (mid scenario only) */}
      <Column sm={4} md={8} lg={16} style={{ marginBlockEnd: '2rem' /* --cds-spacing-07 */ }}>
        <p
          id="sim-stacked-heading"
          className="cds--type-productive-heading-03"
          style={{ marginBlockEnd: '1rem' /* --cds-spacing-05 */ }}
        >
          Per-asset growth (Mid scenario)
        </p>
        <div role="figure" aria-labelledby="sim-stacked-heading">
          <PerAssetStackedAreaChart
            projection={projection}
            displayCurrency={initialCurrency}
            theme={initialTheme}
          />
        </div>
      </Column>

      {/* Region C: Milestones + per-asset summary */}
      <Column sm={4} md={8} lg={16} style={{ marginBlockEnd: '2rem' /* --cds-spacing-07 */ }}>
        <p
          className="cds--type-productive-heading-03"
          style={{ marginBlockEnd: '1rem' /* --cds-spacing-05 */ }}
        >
          Milestone outcomes
        </p>
        <MilestoneGrid
          projection={projection}
          displayCurrency={initialCurrency}
          locale={locale}
        />
      </Column>

      <Column sm={4} md={8} lg={16} style={{ marginBlockEnd: '2rem' /* --cds-spacing-07 */ }}>
        <p
          className="cds--type-productive-heading-03"
          style={{ marginBlockEnd: '1rem' /* --cds-spacing-05 */ }}
        >
          Per-asset breakdown
        </p>
        <PerAssetSummary projection={projection} locale={locale} />
      </Column>

      {localTickers.length > 0 && (
        <Column sm={4} md={8} lg={16}>
          <p
            className="cds--type-productive-heading-03"
            style={{ marginBlockEnd: '0.5rem' /* --cds-spacing-03 */ }}
          >
            Per-ticker breakdown
          </p>
          <p
            className="cds--type-body-compact-01"
            style={{
              color: 'var(--cds-text-secondary)',
              marginBlockEnd: '1rem' /* --cds-spacing-05 */,
            }}
          >
            Each ticker receives an equal 1/5 share of the 50% stocks allocation.
          </p>
          <PerTickerSummary
            projection={projection}
            tickers={localTickers}
            locale={locale}
          />
        </Column>
      )}
    </Grid>
  );
}
