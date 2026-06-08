'use client';
import { StackedAreaChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import type { Projection } from '@/src/lib/projection';
import { ASSET_CLASSES } from '@/src/lib/portfolio';
import type { Currency } from '@/src/lib/currency/types';
import type { Theme } from '@/src/lib/settings/repository';
import { ASSET_LABELS } from '@/src/features/simulation/PerAssetSummary';

interface Props {
  projection: Projection;
  displayCurrency: Currency;
  theme: Theme;
}

function toMajor(amount: number, currency: Currency): number {
  return currency === 'VND' ? amount : amount / 100;
}

export default function PerAssetStackedAreaChart({
  projection,
  displayCurrency,
  theme,
}: Props) {
  const mid = projection.scenarios[1];

  // Yearly downsampling (mirrors SimulationProjectionChart): 31 points × 5 assets = 155 rows.
  // Monthly density was 361 × 5 = 1,805 points, which made tooltip hit-tests visibly slow.
  const data = ASSET_CLASSES.flatMap((asset) =>
    Array.from({ length: 31 }, (_, y) => ({
      group: ASSET_LABELS[asset],
      key: y,
      value: toMajor(mid.byAsset[asset].series[y * 12].value.amount, displayCurrency),
    })),
  );

  const options = {
    title: '',
    axes: {
      bottom: {
        mapsTo: 'key',
        scaleType: ScaleTypes.LINEAR,
        title: 'Year',
        includeZero: true,
      },
      left: {
        mapsTo: 'value',
        title: `Value (${displayCurrency})`,
        includeZero: true,
      },
    },
    points: { enabled: false },
    height: '360px',
    theme,
  };

  return <StackedAreaChart data={data} options={options} />;
}
