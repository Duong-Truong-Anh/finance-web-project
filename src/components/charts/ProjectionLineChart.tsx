'use client';
import { LineChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import type { Projection } from '@/src/lib/projection';
import type { Currency } from '@/src/lib/currency/types';
import type { Theme } from '@/src/lib/settings/repository';

interface Props {
  projection: Projection;
  displayCurrency: Currency;
  theme: Theme;
}

// Yearly downsampling: 31 points × 3 scenarios = 93 data rows
const YEARLY_INDICES = Array.from({ length: 31 }, (_, i) => i * 12);
const SCENARIO_LABELS = ['15% growth', '17.5% growth', '20% growth'] as const;

function toMajor(amount: number, currency: Currency): number {
  return currency === 'VND' ? amount : amount / 100;
}

export default function ProjectionLineChart({ projection, displayCurrency, theme }: Props) {
  const allZero = projection.scenarios.every((s) =>
    YEARLY_INDICES.every((k) => s.series[k].value.amount === 0),
  );
  if (allZero) return null;

  const data = projection.scenarios.flatMap((scenario, si) =>
    YEARLY_INDICES.map((k, yi) => ({
      group: SCENARIO_LABELS[si],
      key: `Yr ${yi}`,
      value: toMajor(scenario.series[k].value.amount, displayCurrency),
    })),
  );

  const options = {
    title: '30-year portfolio projection',
    axes: {
      bottom: { mapsTo: 'key', scaleType: ScaleTypes.LABELS, title: 'Year' },
      left: {
        mapsTo: 'value',
        title: `Value (${displayCurrency})`,
        includeZero: true,
      },
    },
    height: '280px',
    theme,
  };

  return <LineChart data={data} options={options} />;
}
