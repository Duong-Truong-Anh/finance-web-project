'use client';
import { LineChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import type { Projection } from '@/src/lib/projection';
import type { Currency } from '@/src/lib/currency/types';
import { formatCompact, type Locale } from '@/src/lib/currency/format';
import type { Theme } from '@/src/lib/settings/repository';
import { SCENARIO_LINE_COLORS } from './scenario-colors';

interface Props {
  projection: Projection;
  displayCurrency: Currency;
  theme: Theme;
}

// Yearly downsampling: 31 points × 3 scenarios = 93 data rows
const YEARLY_INDICES = Array.from({ length: 31 }, (_, i) => i * 12);
const SCENARIO_LABELS = ['15% growth', '17.5% growth', '20% growth'] as const;

// One color identity per scenario (ADR 012): green = Low, blue = Mid, purple =
// High, matching the MilestoneGrid Tags. Keyed by this chart's own group labels
// (which differ from the Simulation chart's); Carbon derives both the line
// stroke and the tooltip swatch from this same scale.
const SCENARIO_COLOR_SCALE = Object.fromEntries(
  SCENARIO_LABELS.map((label, i) => [label, SCENARIO_LINE_COLORS[i]]),
);

function toMajor(amount: number, currency: Currency): number {
  return currency === 'VND' ? amount : amount / 100;
}

// Carbon Charts v1.27.10 sorts ruler-tooltip rows by value descending with no sort
// hook; customHTML reorders the <li> rows of Carbon's own defaultHTML so the reading
// order is ascending-growth (15% → 17.5% → 20%), matching MilestoneGrid's Tag order.
// Format and swatches are preserved — only order changes. See SimulationProjectionChart.
function orderedTooltip(_data: unknown, defaultHTML: string): string {
  const rows = defaultHTML.match(/<li>[\s\S]*?<\/li>/g);
  if (!rows) return defaultHTML;
  const head = rows.filter((li) => !li.includes('tooltip-color'));
  const series = rows
    .filter((li) => li.includes('tooltip-color'))
    .sort((a, b) => scenarioRank(a) - scenarioRank(b));
  return `<ul class="multi-tooltip">${[...head, ...series].join('')}</ul>`;
}

function scenarioRank(li: string): number {
  const i = SCENARIO_LABELS.findIndex((label) => li.includes(label));
  return i === -1 ? SCENARIO_LABELS.length : i;
}

export default function ProjectionLineChart({ projection, displayCurrency, theme }: Props) {
  const allZero = projection.scenarios.every((s) =>
    YEARLY_INDICES.every((k) => s.series[k].value.amount === 0),
  );
  if (allZero) return null;

  const locale: Locale = displayCurrency === 'VND' ? 'vi-VN' : 'en-US';
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
        ticks: { formatter: (tick: number | Date) => formatCompact(Number(tick), locale) },
      },
    },
    // Scenarios are mutually exclusive, not additive — suppress the summed Total row.
    tooltip: { customHTML: orderedTooltip, showTotal: false },
    color: { scale: SCENARIO_COLOR_SCALE },
    height: '280px',
    theme,
  };

  return <LineChart data={data} options={options} />;
}
