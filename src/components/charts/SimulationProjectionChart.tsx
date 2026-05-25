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

// Yearly downsampling: 31 points (year 0..30) × 3 scenarios = 93 data rows.
// Hit-test cost on mousemove scales with rendered point count; 1,083 monthly
// points caused ~1s tooltip latency in manual QA. Mirrors ProjectionLineChart.
const TOTAL_YEARS = 31;
const SCENARIO_LABELS = ['Low (15%)', 'Mid (17.5%)', 'High (20%)'] as const;

function toMajor(amount: number, currency: Currency): number {
  return currency === 'VND' ? amount : amount / 100;
}

export default function SimulationProjectionChart({ projection, displayCurrency, theme }: Props) {
  const data = projection.scenarios.flatMap((scenario, si) =>
    Array.from({ length: TOTAL_YEARS }, (_, y) => ({
      group: SCENARIO_LABELS[si],
      key: y,
      value: toMajor(scenario.series[y * 12].value.amount, displayCurrency),
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
    thresholds: [
      {
        axis: 'x' as const,
        value: 5,
        label: 'End of contribution',
        fillColor: 'var(--cds-border-subtle-01)',
      },
    ],
    height: '440px',
    theme,
  };

  return <LineChart data={data} options={options} />;
}
