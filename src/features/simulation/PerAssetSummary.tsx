'use client';
import {
  StructuredListBody,
  StructuredListCell,
  StructuredListHead,
  StructuredListRow,
  StructuredListWrapper,
} from '@carbon/react';
import type { Projection } from '@/src/lib/projection';
import { ASSET_CLASSES, type AssetClass } from '@/src/lib/portfolio';
import { format, type Locale } from '@/src/lib/currency/format';

interface Props {
  projection: Projection;
  locale: Locale;
}

const ASSET_LABELS: Record<AssetClass, string> = {
  stocks:  'Stocks',
  savings: 'Savings',
  cash:    'Cash',
  gold:    'Gold',
  usd:     'USD',
};

export default function PerAssetSummary({ projection, locale }: Props) {
  const mid = projection.scenarios[1];

  return (
    <StructuredListWrapper aria-label="Per-asset summary at year 30, mid scenario">
      <StructuredListHead>
        <StructuredListRow head>
          <StructuredListCell head>Asset</StructuredListCell>
          <StructuredListCell head>Contributed (months 1–60)</StructuredListCell>
          <StructuredListCell head>Year 30: Mid (17.5%)</StructuredListCell>
        </StructuredListRow>
      </StructuredListHead>
      <StructuredListBody>
        {ASSET_CLASSES.map((asset) => {
          const series = mid.byAsset[asset];
          return (
            <StructuredListRow key={asset}>
              <StructuredListCell>{ASSET_LABELS[asset]}</StructuredListCell>
              <StructuredListCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                {format(series.totalContributed, locale)}
              </StructuredListCell>
              <StructuredListCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                {format(series.milestones.yr30, locale)}
              </StructuredListCell>
            </StructuredListRow>
          );
        })}
      </StructuredListBody>
    </StructuredListWrapper>
  );
}
