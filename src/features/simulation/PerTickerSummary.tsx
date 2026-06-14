'use client';
import {
  StructuredListBody,
  StructuredListCell,
  StructuredListHead,
  StructuredListRow,
  StructuredListWrapper,
} from '@carbon/react';
import type { Projection } from '@/src/lib/projection';
import type { TickerSelection } from '@/src/lib/portfolio';
import type { Money } from '@/src/lib/currency/types';
import { format, type Locale } from '@/src/lib/currency/format';

interface Props {
  projection: Projection;
  tickers: TickerSelection[];
  locale: Locale;
}

// Inline mirror of MilestoneGrid's divideByFive — the ÷5 share is N=2; do not
// extract a shared helper. The Math.round keeps the money invariant (integer
// minor units). Every ticker gets the same value: the engine treats stocks as
// one pool and does not model individual ticker performance.
function divideByFive(money: Money): Money {
  return { amount: Math.round(money.amount / 5), currency: money.currency };
}

export default function PerTickerSummary({ projection, tickers, locale }: Props) {
  const stocks = projection.scenarios[1].byAsset.stocks;
  const contributed = divideByFive(stocks.totalContributed);
  const yr30 = divideByFive(stocks.milestones.yr30);

  return (
    <StructuredListWrapper aria-label="Per-ticker breakdown at year 30, mid scenario">
      <StructuredListHead>
        <StructuredListRow head>
          <StructuredListCell head>Ticker</StructuredListCell>
          <StructuredListCell head>Contributed (months 1–60)</StructuredListCell>
          <StructuredListCell head>Year 30: Mid (17.5%)</StructuredListCell>
        </StructuredListRow>
      </StructuredListHead>
      <StructuredListBody>
        {tickers.map((ticker) => (
          <StructuredListRow key={ticker.symbol}>
            <StructuredListCell>
              <span>{ticker.symbol}</span>
              {ticker.description && (
                <span
                  className="cds--type-label-01"
                  style={{
                    display: 'block',
                    color: 'var(--cds-text-secondary)',
                  }}
                >
                  {ticker.description}
                </span>
              )}
            </StructuredListCell>
            <StructuredListCell style={{ fontVariantNumeric: 'tabular-nums' }}>
              {format(contributed, locale)}
            </StructuredListCell>
            <StructuredListCell style={{ fontVariantNumeric: 'tabular-nums' }}>
              {format(yr30, locale)}
            </StructuredListCell>
          </StructuredListRow>
        ))}
      </StructuredListBody>
    </StructuredListWrapper>
  );
}
