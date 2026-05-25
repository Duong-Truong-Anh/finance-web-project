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

  const data = ASSET_CLASSES.flatMap((asset) =>
    mid.byAsset[asset].series.map((point, k) => ({
      group: ASSET_LABELS[asset],
      key: k,
      value: toMajor(point.value.amount, displayCurrency),
    })),
  );

  const options = {
    title: '',
    axes: {
      bottom: {
        mapsTo: 'key',
        scaleType: ScaleTypes.LINEAR,
        title: 'Month',
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
