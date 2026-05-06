'use client';
import { ComboChart } from '@carbon/charts-react';
import { ScaleTypes } from '@carbon/charts';
import type { CashFlowMonth } from '@/src/lib/aggregation/aggregate-by-month';
import type { Currency } from '@/src/lib/currency/types';
import type { Theme } from '@/src/lib/settings/repository';

interface Props {
  months: CashFlowMonth[];
  displayCurrency: Currency;
  theme: Theme;
}

function toMajor(amount: number, currency: Currency): number {
  return currency === 'VND' ? amount : amount / 100;
}

export default function CashFlowComboChart({ months, displayCurrency, theme }: Props) {
  if (months.length === 0) return null;

  const data = [
    ...months.map((m) => ({ group: 'Income', key: m.yearMonth, value: toMajor(m.inflow.amount, displayCurrency) })),
    ...months.map((m) => ({ group: 'Expenses', key: m.yearMonth, value: toMajor(m.outflow.amount, displayCurrency) })),
    ...months.map((m) => ({ group: 'Net flow', key: m.yearMonth, value: toMajor(m.netFlow.amount, displayCurrency) })),
  ];

  const options = {
    title: 'Monthly cash flow',
    axes: {
      bottom: { mapsTo: 'key', scaleType: ScaleTypes.LABELS, title: 'Month' },
      left: { mapsTo: 'value', title: `Amount (${displayCurrency})`, includeZero: true },
    },
    comboChartTypes: [
      { type: 'grouped-bar', correspondingDatasets: ['Income', 'Expenses'] },
      { type: 'line', correspondingDatasets: ['Net flow'] },
    ],
    height: '320px',
    theme,
  };

  return <ComboChart data={data} options={options} />;
}
