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
    <Tile style={{ padding: 'var(--cds-spacing-06)' }}>
      <p
        className="cds--type-productive-heading-03"
        style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}
      >
        Asset allocation
      </p>
      <p
        className="cds--type-label-01"
        style={{ color: 'var(--cds-text-helper)', marginBlockEnd: 'var(--cds-spacing-06)' }}
      >
        Fixed allocation per the brief. Each net-flow contribution is split across the five
        classes in these proportions.
      </p>
      <ul
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--cds-spacing-04)',
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
