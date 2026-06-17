'use client';
import { Tag, Tile } from '@carbon/react';
import type { Projection } from '@/src/lib/projection';
import type { Currency } from '@/src/lib/currency/types';
import { format, type Locale } from '@/src/lib/currency/format';
import type { Money } from '@/src/lib/currency/types';

interface Props {
  projection: Projection;
  displayCurrency: Currency;
  locale: Locale;
}

const HORIZONS: Array<{ key: 'yr10' | 'yr20' | 'yr30'; label: string }> = [
  { key: 'yr10', label: 'Year 10' },
  { key: 'yr20', label: 'Year 20' },
  { key: 'yr30', label: 'Year 30' },
];

const SCENARIO_TAGS: Array<{ name: string; type: 'green' | 'blue' | 'purple' }> = [
  { name: 'Low',  type: 'green' },
  { name: 'Mid',  type: 'blue' },
  { name: 'High', type: 'purple' },
];

function divideByFive(money: Money): Money {
  return { amount: Math.round(money.amount / 5), currency: money.currency };
}

export default function MilestoneGrid({ projection, displayCurrency, locale }: Props) {
  return (
    <div
      role="grid"
      aria-label="Milestone outcomes by horizon and scenario"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2rem' /* --cds-spacing-07 */,
      }}
    >
      {HORIZONS.flatMap((horizon) =>
        projection.scenarios.map((scenario, si) => {
          const totalMoney = scenario.milestones[horizon.key];
          const stockMoney = scenario.byAsset.stocks.milestones[horizon.key];
          const perStockMoney = divideByFive(stockMoney);
          const tag = SCENARIO_TAGS[si];
          const totalLabel = format(totalMoney, locale);

          return (
            <Tile
              key={`${horizon.key}-${scenario.variant}`}
              role="gridcell"
              aria-label={`${horizon.label}, ${tag.name} scenario, ${totalLabel}`}
              style={{ padding: '1.5rem' /* --cds-spacing-06 */ }}
            >
              <p
                className="cds--type-label-01"
                style={{ color: 'var(--cds-text-helper)' }}
              >
                {horizon.label}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem' /* --cds-spacing-03 */,
                  marginBlock: '0.5rem' /* --cds-spacing-03 */,
                }}
              >
                <Tag size="sm" type={tag.type}>
                  {tag.name}
                </Tag>
                <span
                  className="cds--type-label-01"
                  style={{ color: 'var(--cds-text-secondary)' }}
                >
                  {scenario.annualStockRate * 100}% on stocks
                </span>
              </div>
              <p
                className="cds--type-productive-heading-05"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {totalLabel}
              </p>
              <p
                className="cds--type-body-compact-01"
                style={{
                  color: 'var(--cds-text-secondary)',
                  marginBlockStart: '0.5rem' /* --cds-spacing-03 */,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                Per ticker: {format(perStockMoney, locale)}
              </p>
            </Tile>
          );
        }),
      )}
    </div>
  );
}
