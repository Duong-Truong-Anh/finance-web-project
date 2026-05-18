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
import AllocationTile from './AllocationTile';
import TickerInputTile from './TickerInputTile';
import MilestoneGrid from './MilestoneGrid';
import PerAssetSummary from './PerAssetSummary';
import SimulationEmptyState from './SimulationEmptyState';
import SimulationProjectionChart from '@/src/components/charts/SimulationProjectionChart';

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
  symbol: string,
): TickerSelection[] {
  const padded: Array<TickerSelection | null> = [...current];
  while (padded.length <= index) padded.push(null);
  if (symbol === '') {
    padded[index] = null;
  } else {
    const existing = padded[index];
    padded[index] = {
      symbol,
      description: existing?.description ?? '',
      exchange: existing?.exchange ?? null,
      pickedAt: new Date().toISOString(),
    };
  }
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

  // Local optimistic ticker state — fixes the blur-race when two slots fire close together.
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

  function handleSlotCommit(index: number, symbol: string) {
    if (cfgState.status !== 'ready') return;
    const next = computeNextTickers(localTickers, index, symbol);
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
            style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}
          >
            Simulation
          </h1>
          <SkeletonText heading width="40%" />
          <SkeletonPlaceholder style={{ width: '100%', height: '440px' }} />
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
            style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}
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
            style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}
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
            style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}
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
          style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}
        >
          Simulation
        </h1>
      </Column>

      {/* Region A — Configuration */}
      <Column sm={4} md={8} lg={6} style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}>
        <AllocationTile />
      </Column>

      <Column sm={4} md={8} lg={10} style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}>
        <p
          className="cds--type-productive-heading-03"
          style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}
        >
          Your stocks (5 slots)
        </p>
        <p
          className="cds--type-label-01"
          style={{ color: 'var(--cds-text-helper)', marginBlockEnd: 'var(--cds-spacing-05)' }}
        >
          Enter a symbol and tab away to save. The 50% stocks allocation is split equally across
          the slots you fill.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 'var(--cds-spacing-05)',
          }}
        >
          {slotIndices.map((i) => (
            <TickerInputTile
              key={i}
              index={i}
              symbol={localTickers[i]?.symbol ?? ''}
              onCommit={(symbol) => handleSlotCommit(i, symbol)}
            />
          ))}
        </div>
      </Column>

      {missing > 0 && (
        <Column sm={4} md={8} lg={16} style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}>
          <InlineNotification
            kind="info"
            lowContrast
            title="Portfolio incomplete"
            subtitle={`Add ${missing} more ticker${missing === 1 ? '' : 's'} to complete your portfolio. The projection assumes the 50% stocks allocation is split equally across 5 stocks regardless of how many symbols you have entered.`}
            hideCloseButton
          />
        </Column>
      )}

      {/* Region B — Projection chart */}
      <Column sm={4} md={8} lg={16} style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}>
        <SimulationProjectionChart
          projection={projection}
          displayCurrency={initialCurrency}
          theme={initialTheme}
        />
      </Column>

      {/* Region C — Milestones + per-asset summary */}
      <Column sm={4} md={8} lg={16} style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}>
        <p
          className="cds--type-productive-heading-03"
          style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}
        >
          Milestone outcomes
        </p>
        <MilestoneGrid
          projection={projection}
          displayCurrency={initialCurrency}
          locale={locale}
        />
      </Column>

      <Column sm={4} md={8} lg={16}>
        <p
          className="cds--type-productive-heading-03"
          style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}
        >
          Per-asset breakdown
        </p>
        <PerAssetSummary projection={projection} locale={locale} />
      </Column>
    </Grid>
  );
}
