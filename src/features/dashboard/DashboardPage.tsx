'use client';
import { useMemo } from 'react';
import {
  Column,
  DataTableSkeleton,
  Grid,
  InlineNotification,
  ProgressBar,
  SkeletonPlaceholder,
  SkeletonText,
  Tile,
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
import MilestoneHero from './MilestoneHero';
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
  // Carry the local calendar date in UTC fields so it matches currentMonthIndex's
  // UTC getters and the user-entered `occurredOn` calendar dates. Without this, a
  // UTC+7 user near a month boundary reads the wrong month for ~7 hours.
  const today = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);

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

        <Column sm={4} md={8} lg={16}>
          <SkeletonText width="40%" />
          <SkeletonText width="55%" heading />
          <SkeletonText width="65%" />
        </Column>

        {[5, 6, 5].map((span, i) => (
          <Column key={i} sm={4} md={i === 2 ? 8 : 4} lg={span}>
            <Tile style={{ height: '100%', minBlockSize: 'var(--cds-spacing-13)' }}>
              <SkeletonText width="60%" />
              <SkeletonText width="80%" heading />
              <SkeletonText width="50%" />
            </Tile>
          </Column>
        ))}

        <Column sm={4} md={8} lg={16} style={{ marginBlockStart: 'var(--cds-spacing-07)' }}>
          <SkeletonPlaceholder style={{ width: '100%', height: '280px' }} />
        </Column>

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
  // series[k] is the END of month k with month 1 = the anchor month, and each
  // contribution is invested at the start of its month (spec §4 annuity-due).
  // "Today's value" is therefore series[offset + 1]; without +1, series[0] —
  // always exactly 0 by construction — renders whenever today is in the anchor month.
  const safeMonthIndex = Math.min(360, (monthIndex ?? 0) + 1);

  // Contribution window is months 1..60. N = investing months elapsed (1-based, capped).
  const investingMonths = Math.min(60, (monthIndex ?? 0) + 1);
  const windowComplete = (monthIndex ?? 0) + 1 > 60;

  // Anchor year = earliest transaction's calendar year (same anchor convention as
  // currentMonthIndex). The projection carries no calendar date, so derive it here for
  // the hero's concrete-year copy. "around" wording absorbs the month-360 boundary.
  const anchorYear = Number(
    transactions
      .reduce((min, tx) => (tx.occurredOn < min ? tx.occurredOn : min), transactions[0].occurredOn)
      .slice(0, 4),
  );

  // Current-month net flow
  const todayYM = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`;
  const months = aggregateByMonth(transactions, initialCurrency, fx);
  const thisMonth = months.find((m) => m.yearMonth === todayYM);
  const thisMonthNetFlow = thisMonth?.netFlow ?? { amount: 0, currency: initialCurrency };
  const isNegative = thisMonthNetFlow.amount < 0;

  const thisMonthInflow = thisMonth?.inflow ?? { amount: 0, currency: initialCurrency };
  const thisMonthOutflow = thisMonth?.outflow ?? { amount: 0, currency: initialCurrency };

  // KPI values — projection-dependent tiles show skeleton if cfg is still loading
  const projReady = projection !== null;

  // totalContributed is identical across scenarios; read mid for consistency with the
  // mid headline used by the hero and growth-so-far tile.
  const contributedValue = projReady
    ? format(projection.scenarios[1].totalContributed, locale)
    : '—';

  // Growth so far = today's mid value − total contributed (both Money, same currency).
  // Inline subtraction (N=1, no util). Positive once the first contribution compounds.
  const todayMid = projReady ? projection.scenarios[1].series[safeMonthIndex]?.value ?? null : null;
  const growthMoney =
    projReady && todayMid
      ? {
          amount: todayMid.amount - projection.scenarios[1].totalContributed.amount,
          currency: todayMid.currency,
        }
      : null;
  const todayMidValue = todayMid ? format(todayMid, locale) : '—';
  const growthValue = growthMoney ? format(growthMoney, locale) : '—';
  const growthPositive = growthMoney ? growthMoney.amount > 0 : false;

  // Milestone hero — mid headline at yr30, low/high range, 10y/20y mid waypoints.
  const yr30Value = projReady ? format(projection.scenarios[1].milestones.yr30, locale) : '—';
  const yr30Low = projReady ? format(projection.scenarios[0].milestones.yr30, locale) : '—';
  const yr30High = projReady ? format(projection.scenarios[2].milestones.yr30, locale) : '—';
  const yr10Value = projReady ? format(projection.scenarios[1].milestones.yr10, locale) : '—';
  const yr20Value = projReady ? format(projection.scenarios[1].milestones.yr20, locale) : '—';

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

      {/* Milestone hero — the 30-year outcome at the current pace */}
      <Column sm={4} md={8} lg={16}>
        <MilestoneHero
          loading={!projReady}
          yr30Value={yr30Value}
          yr30Low={yr30Low}
          yr30High={yr30High}
          yr30Year={anchorYear + 30}
          waypoints={[
            { label: `In 10 years (by around ${anchorYear + 10})`, value: yr10Value },
            { label: `In 20 years (by around ${anchorYear + 20})`, value: yr20Value },
          ]}
        />
      </Column>

      {/* KPI tiles — 3 across on lg (5/6/5), reflow on md, stacked on sm */}
      <Column sm={4} md={4} lg={5}>
        <KpiTile
          label="This month"
          value={format(thisMonthNetFlow, locale)}
          sub={`Inflow ${format(thisMonthInflow, locale)} · Outflow ${format(thisMonthOutflow, locale)}`}
          href="/cash-flow"
          status={isNegative ? 'negative' : undefined}
        >
          {!windowComplete && (
            <p
              className="cds--type-helper-text-01"
              style={{ color: 'var(--cds-text-secondary)' }}
            >
              {thisMonthNetFlow.amount > 0
                ? 'Your surplus this month goes into investments.'
                : 'No surplus this month, so nothing is invested.'}
            </p>
          )}
        </KpiTile>
      </Column>

      <Column sm={4} md={4} lg={6}>
        <KpiTile label="Contribution progress" value={contributedValue} href="/cash-flow">
          <ProgressBar
            label="Contribution window"
            hideLabel
            helperText={`${investingMonths} of 60 months`}
            value={investingMonths}
            max={60}
            size="small"
            status={windowComplete ? 'finished' : 'active'}
          />
          <p className="cds--type-helper-text-01" style={{ color: 'var(--cds-text-secondary)' }}>
            {windowComplete
              ? 'Contribution window complete. Now compounding.'
              : 'You invest for 5 years, then it compounds for 25 more.'}
          </p>
        </KpiTile>
      </Column>

      <Column sm={4} md={8} lg={5}>
        <KpiTile
          label="Growth so far"
          value={growthValue}
          sub={`Value ${todayMidValue} · Contributed ${contributedValue}`}
          href="/simulation"
          status={growthPositive ? 'positive' : undefined}
        >
          <p className="cds--type-helper-text-01" style={{ color: 'var(--cds-text-secondary)' }}>
            What your contributions have earned so far, mid scenario.
          </p>
        </KpiTile>
      </Column>

      {/* Projection chart — reserve 280px slot while cfg loads so the chart's
          arrival doesn't grow page height. tx-ready-before-cfg-ready is a real
          intermediate state on cold load. */}
      <Column sm={4} md={8} lg={16} style={{ marginBlockStart: 'var(--cds-spacing-07)' }}>
        {projReady ? (
          <ProjectionLineChart
            projection={projection}
            displayCurrency={initialCurrency}
            theme={initialTheme}
          />
        ) : (
          <SkeletonPlaceholder style={{ width: '100%', height: '280px' }} />
        )}
      </Column>

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
