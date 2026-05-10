'use client';
import { useMemo } from 'react';
import {
  Column,
  DataTableSkeleton,
  Grid,
  InlineNotification,
  SkeletonText,
} from '@carbon/react';
import { computeProjection } from '@/src/lib/projection';
import { currentMonthIndex } from '@/src/lib/projection/current-month-index';
import { aggregateByMonth } from '@/src/lib/aggregation/aggregate-by-month';
import { format } from '@/src/lib/currency/format';
import type { Currency, FxRateSnapshot } from '@/src/lib/currency/types';
import type { Theme } from '@/src/lib/settings/repository';
import { useTransactions } from '@/src/features/cash-flow/useTransactions';
import { useFx } from '@/src/features/cash-flow/useFx';
import { usePortfolioConfig } from './usePortfolioConfig';
import KpiTile from './KpiTile';
import EmptyState from './EmptyState';
import RecentTransactionsTable from './RecentTransactionsTable';
import ProjectionLineChart from '@/src/components/charts/ProjectionLineChart';

// Fallback FX used only when live rates are loading or errored; chart degrades gracefully.
const IDENTITY_FX: FxRateSnapshot = {
  base: 'USD',
  rates: { VND: 25000, USD: 1 },
  fetchedAt: '1970-01-01T00:00:00.000Z',
};

function localeFor(currency: Currency): 'vi-VN' | 'en-US' {
  return currency === 'VND' ? 'vi-VN' : 'en-US';
}

interface Props {
  initialCurrency: Currency;
  initialTheme: Theme;
}

export default function DashboardPage({ initialCurrency, initialTheme }: Props) {
  const { state: txState } = useTransactions();
  const fxState = useFx();
  const cfgState = usePortfolioConfig();

  // Stable "today" for the lifetime of this mount — never re-created on re-render.
  const today = useMemo(() => new Date(), []);

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

  const monthIndex = useMemo(() => {
    if (txState.status !== 'ready') return null;
    return currentMonthIndex(txState.transactions, today);
  }, [txState, today]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (txState.status === 'loading') {
    return (
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <h1
            className="cds--type-productive-heading-04"
            style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}
          >
            Dashboard
          </h1>
        </Column>

        {[0, 1, 2, 3].map((i) => (
          <Column key={i} sm={4} md={4} lg={4}>
            <div style={{ padding: 'var(--cds-spacing-05)', background: 'var(--cds-layer-01)' }}>
              <SkeletonText width="60%" />
              <SkeletonText width="80%" heading />
              <SkeletonText width="50%" />
            </div>
          </Column>
        ))}

        <Column sm={4} md={8} lg={16} style={{ marginBlockStart: 'var(--cds-spacing-07)' }}>
          <DataTableSkeleton
            headers={[
              { header: 'Date' },
              { header: 'Kind' },
              { header: 'Name' },
              { header: 'Amount' },
            ]}
            rowCount={5}
            showToolbar={false}
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
            style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}
          >
            Dashboard
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

  // txState.status === 'ready' guaranteed from here
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
            Dashboard
          </h1>
          <EmptyState />
        </Column>
      </Grid>
    );
  }

  // ── Populated dashboard ────────────────────────────────────────────────────
  // monthIndex is non-null here (transactions.length > 0)
  const safeMonthIndex = monthIndex ?? 0;

  // Current-month net flow
  const todayYM = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`;
  const months = aggregateByMonth(transactions, initialCurrency, fx);
  const thisMonth = months.find((m) => m.yearMonth === todayYM);
  const thisMonthNetFlow = thisMonth?.netFlow ?? { amount: 0, currency: initialCurrency };
  const isNegative = thisMonthNetFlow.amount < 0;

  const thisMonthInflow = thisMonth?.inflow ?? { amount: 0, currency: initialCurrency };
  const thisMonthOutflow = thisMonth?.outflow ?? { amount: 0, currency: initialCurrency };

  const uniqueMonthCount = new Set(transactions.map((tx) => tx.occurredOn.slice(0, 7))).size;

  // KPI values — projection-dependent tiles show skeleton if cfg is still loading
  const projReady = projection !== null;

  const contributedValue = projReady
    ? format(projection.scenarios[0].totalContributed, locale)
    : '—';

  const todayValue =
    projReady && projection.scenarios[1].series[safeMonthIndex]
      ? format(projection.scenarios[1].series[safeMonthIndex].value, locale)
      : '—';

  const todayLow =
    projReady && projection.scenarios[0].series[safeMonthIndex]
      ? format(projection.scenarios[0].series[safeMonthIndex].value, locale)
      : '—';

  const todayHigh =
    projReady && projection.scenarios[2].series[safeMonthIndex]
      ? format(projection.scenarios[2].series[safeMonthIndex].value, locale)
      : '—';

  const yr30Value = projReady
    ? format(projection.scenarios[1].milestones.yr30, locale)
    : '—';

  const yr30Low = projReady ? format(projection.scenarios[0].milestones.yr30, locale) : '—';
  const yr30High = projReady ? format(projection.scenarios[2].milestones.yr30, locale) : '—';

  return (
    <Grid>
      <Column sm={4} md={8} lg={16}>
        <h1
          className="cds--type-productive-heading-04"
          style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}
        >
          Dashboard
        </h1>
      </Column>

      {/* KPI tiles — 4 across on lg, 2×2 on md, stacked on sm */}
      <Column sm={4} md={4} lg={4}>
        <KpiTile
          label="This month"
          value={format(thisMonthNetFlow, locale)}
          sub={`Inflow ${format(thisMonthInflow, locale)} − Outflow ${format(thisMonthOutflow, locale)}`}
          href="/cash-flow"
          negative={isNegative}
        />
      </Column>

      <Column sm={4} md={4} lg={4}>
        <KpiTile
          label="Contributed"
          value={contributedValue}
          sub={`from ${uniqueMonthCount} month${uniqueMonthCount !== 1 ? 's' : ''} entered`}
          href="/cash-flow"
        />
      </Column>

      <Column sm={4} md={4} lg={4}>
        <KpiTile
          label="Today's value (mid)"
          value={todayValue}
          sub={`low: ${todayLow} · high: ${todayHigh}`}
          href="/simulation"
        />
      </Column>

      <Column sm={4} md={4} lg={4}>
        <KpiTile
          label="In 30 years (mid)"
          value={yr30Value}
          sub={`low: ${yr30Low} · high: ${yr30High}`}
          href="/simulation"
        />
      </Column>

      {/* Projection chart */}
      {projReady && (
        <Column sm={4} md={8} lg={16} style={{ marginBlockStart: 'var(--cds-spacing-07)' }}>
          <ProjectionLineChart
            projection={projection}
            displayCurrency={initialCurrency}
            theme={initialTheme}
          />
        </Column>
      )}

      {/* Recent transactions */}
      <Column sm={4} md={8} lg={16} style={{ marginBlockStart: 'var(--cds-spacing-07)' }}>
        <RecentTransactionsTable
          transactions={transactions}
          displayCurrency={initialCurrency}
          fxState={fxState}
        />
      </Column>
    </Grid>
  );
}
