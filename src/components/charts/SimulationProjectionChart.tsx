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

// Yearly downsampling: 31 points (year 0..30) × 3 scenarios = 93 data rows.
// Hit-test cost on mousemove scales with rendered point count; 1,083 monthly
// points caused ~1s tooltip latency in manual QA. Mirrors ProjectionLineChart.
const TOTAL_YEARS = 31;
const SCENARIO_LABELS = ['Low (15%)', 'Mid (17.5%)', 'High (20%)'] as const;

// One color identity per scenario (ADR 012): green = Low, blue = Mid, purple =
// High, matching the MilestoneGrid Tags. Keyed by this chart's own group labels;
// Carbon derives both the line stroke and the tooltip swatch from this scale.
const SCENARIO_COLOR_SCALE = Object.fromEntries(
  SCENARIO_LABELS.map((label, i) => [label, SCENARIO_LINE_COLORS[i]]),
);

function toMajor(amount: number, currency: Currency): number {
  return currency === 'VND' ? amount : amount / 100;
}

// Carbon Charts v1.27.10 sorts ruler-tooltip rows by value descending and exposes
// no sort hook (TooltipOptions has no itemSortFunction). customHTML is the only
// lever, so we reorder the <li> rows inside Carbon's own rendered defaultHTML —
// swatches, color classes, and value formatting stay byte-identical; only the
// reading order changes to Low → Mid → High, matching MilestoneGrid's Tag order.
function orderedTooltip(_data: unknown, defaultHTML: string): string {
  const rows = defaultHTML.match(/<li>[\s\S]*?<\/li>/g);
  if (!rows) return defaultHTML;
  // The title row (shared x-axis label) carries no color swatch; keep it first.
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

export default function SimulationProjectionChart({ projection, displayCurrency, theme }: Props) {
  const locale: Locale = displayCurrency === 'VND' ? 'vi-VN' : 'en-US';
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
        // Carbon renders thresholds per-axis, not from a top-level options.thresholds
        // array. A threshold on the bottom (x) axis draws a vertical reference line at
        // that year. Phase 3.3 placed it at options.thresholds with a non-existent
        // `axis: 'x'` field, so the line never rendered at all (Phase 3.4 theme audit).
        thresholds: [
          {
            value: 5,
            label: 'End of contribution',
            // Carbon Charts pipes fillColor through a path that strips the leading zero
            // from a numeric token suffix (`border-strong-01` → the undefined
            // `border-strong-1`, rendering stroke:none). text-secondary has no numeric
            // suffix to mangle and is a high-contrast token across all four themes.
            fillColor: 'var(--cds-text-secondary)',
          },
        ],
      },
      left: {
        mapsTo: 'value',
        title: `Value (${displayCurrency})`,
        includeZero: true,
        ticks: { formatter: (tick: number | Date) => formatCompact(Number(tick), locale) },
      },
    },
    // Low/Mid/High are mutually-exclusive scenarios, not additive components, so a
    // summed Total row would mislead — suppress it (Carbon's line-chart default is on).
    tooltip: { customHTML: orderedTooltip, showTotal: false },
    color: { scale: SCENARIO_COLOR_SCALE },
    points: { enabled: false },
    height: '440px',
    theme,
  };

  return <LineChart data={data} options={options} />;
}
