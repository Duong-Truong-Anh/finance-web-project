'use client';
import { Tile } from '@carbon/react';
import { ASSET_ALLOCATION, ASSET_CLASSES, type AssetClass } from '@/src/lib/portfolio';

const ASSET_LABELS: Record<AssetClass, string> = {
  stocks:  'Stocks',
  savings: 'Savings',
  cash:    'Cash',
  gold:    'Gold',
  usd:     'USD',
};

export default function AllocationTile() {
  return (
    <Tile style={{ padding: '1.5rem' /* --cds-spacing-06 */ }}>
      <p
        className="cds--type-productive-heading-03"
        style={{ marginBlockEnd: '1rem' /* --cds-spacing-05 */ }}
      >
        Asset allocation
      </p>
      <p
        className="cds--type-label-01"
        style={{ color: 'var(--cds-text-helper)', marginBlockEnd: '1.5rem' /* --cds-spacing-06 */ }}
      >
        Fixed allocation per the brief. Each net-flow contribution is split across the five
        classes in these proportions. The 50% stocks slice is split equally across the
        tickers you enter on the right.
      </p>
      <ul
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem' /* --cds-spacing-04 */,
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {ASSET_CLASSES.map((asset) => (
          <li
            key={asset}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <span className="cds--type-body-01">{ASSET_LABELS[asset]}</span>
            <span
              className="cds--type-productive-heading-02"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {(ASSET_ALLOCATION[asset] * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </Tile>
  );
}
