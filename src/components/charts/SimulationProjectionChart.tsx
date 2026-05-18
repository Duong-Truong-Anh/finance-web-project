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

// Full-density: every monthly point (361 per scenario). Simulation is the dense view per spec §4.
// Dashboard downsamples to 31 yearly points; do not share the data shape.
const TOTAL_MONTHS = 361;
const SCENARIO_LABELS = ['Low (15%)', 'Mid (17.5%)', 'High (20%)'] as const;

function toMajor(amount: number, currency: Currency): number {
  return currency === 'VND' ? amount : amount / 100;
}

export default function SimulationProjectionChart({ projection, displayCurrency, theme }: Props) {
  const data = projection.scenarios.flatMap((scenario, si) =>
    Array.from({ length: TOTAL_MONTHS }, (_, m) => ({
      group: SCENARIO_LABELS[si],
      key: m,
      value: toMajor(scenario.series[m].value.amount, displayCurrency),
    })),
  );

  const options = {
    // Visible heading is rendered by SimulationPage and provides the chart's accessible name
    // via aria-labelledby on a role="figure" wrapper. Empty title here avoids voice duplication.
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
    thresholds: [
      {
        axis: 'x' as const,
        value: 60,
        label: 'End of contribution',
        fillColor: 'var(--cds-border-subtle-01)',
      },
    ],
    height: '440px',
    theme,
  };

  return <LineChart data={data} options={options} />;
}
