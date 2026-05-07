# Carbon Charts

Carbon's data-visualization library is `@carbon/charts`. It is built on D3 with Carbon styling baked in. Wrappers for React, Angular, Vue, Svelte, and vanilla.

If the official Carbon MCP server is connected, prefer `get_charts` for examples — it covers all five framework wrappers.

## Install

```bash
# React
npm install @carbon/charts @carbon/charts-react d3

# Web Components (built into @carbon/charts itself)
npm install @carbon/charts d3

# Vue
npm install @carbon/charts @carbon/charts-vue d3

# Svelte
npm install @carbon/charts @carbon/charts-svelte d3

# Angular
npm install @carbon/charts @carbon/charts-angular d3
```

```js
// Bundled CSS
import '@carbon/charts/styles.css';
```

## Chart families

### Comparison
- `SimpleBarChart` — categorical bars
- `GroupedBarChart` — grouped bars
- `StackedBarChart` — stacked bars
- `BulletChart` — single-value progress
- `RadarChart`
- `MeterChart`

### Trend over time
- `LineChart`
- `AreaChart`
- `StackedAreaChart`
- `LollipopChart`
- `ComboChart` — line + bar combination

### Composition
- `PieChart`
- `DonutChart`
- `GaugeChart`

### Distribution
- `HistogramChart`
- `ScatterChart`
- `BubbleChart`

### Hierarchical
- `TreeChart`
- `TreemapChart`
- `CirclePackChart`

### Network / flow
- `AlluvialChart`
- `NetworkChart`
- `ChordChart`
- `SankeyChart` (named "Alluvial" in some versions)

### Geo
- `WorldCloudChart`
- `ChoroplethChart` (separate package: `@carbon/charts-react/choropleth`)

## Minimal React example

```jsx
import { SimpleBarChart } from '@carbon/charts-react';
import '@carbon/charts/styles.css';

const data = [
  { group: 'Q1', value: 65000 },
  { group: 'Q2', value: 29123 },
  { group: 'Q3', value: 35213 },
  { group: 'Q4', value: 51234 }
];

const options = {
  title: 'Quarterly revenue',
  axes: {
    left: { mapsTo: 'value', title: 'USD' },
    bottom: { mapsTo: 'group', scaleType: 'labels' }
  },
  height: '400px',
  theme: 'g100'   // 'white' | 'g10' | 'g90' | 'g100'
};

<SimpleBarChart data={data} options={options} />
```

## Minimal Web Components example

```html
<cds-simple-bar-chart></cds-simple-bar-chart>

<script type="module">
  import '@carbon/charts/dist/index.js';

  const chart = document.querySelector('cds-simple-bar-chart');
  chart.data = [
    { group: 'Q1', value: 65000 },
    { group: 'Q2', value: 29123 }
  ];
  chart.options = {
    title: 'Quarterly revenue',
    axes: {
      left: { mapsTo: 'value' },
      bottom: { mapsTo: 'group', scaleType: 'labels' }
    },
    theme: 'g100'
  };
</script>
```

## Theme

Always pass `theme` in options matching the surrounding page. Carbon Charts has its own theme awareness so the chart's background, axis lines, gridlines, tooltips, and legends adapt.

## Color palette

Charts use Carbon's defined color palette for series. The default rotation is the **Carbon Charts color palette** (a deliberately colorblind-aware sequence; differs slightly from the base palette to ensure adjacent series are distinguishable).

Override via `options.color.scale`:

```js
options.color = {
  scale: {
    'Series A': '#0f62fe',  // blue-60
    'Series B': '#8a3ffc',  // purple-60
    'Series C': '#007d79'   // teal-60
  }
};
```

Or pick a different built-in palette via `options.color.pairing.option` (1, 2, 3, 4 — different orderings).

## Accessibility

Carbon Charts ships:
- Keyboard navigation through data points
- ARIA labels on data elements
- Pattern fills (in addition to color) for colorblind safety — enable via `options.style.prefix` or use a chart variant like `Pattern*` versions

## When agent doesn't know the chart shape

If the user asks for "a chart that shows... " and the agent isn't sure which chart, the decision tree:

| Goal | Chart |
|---|---|
| Show how a value compares across categories | SimpleBarChart |
| Show breakdown of categories within a total | StackedBarChart or DonutChart |
| Show value over time | LineChart or AreaChart |
| Show two related series over time | ComboChart |
| Show distribution of a continuous variable | HistogramChart |
| Show correlation between two variables | ScatterChart |
| Show flows or transitions | SankeyChart / AlluvialChart |
| Show progress to a goal | MeterChart or BulletChart |
| Show small multiples / dashboard tiles | Use tile composition with multiple small charts |

## Anti-patterns

- ❌ Using a third-party chart library (Recharts, Victory, Chart.js) inside a Carbon project. Use `@carbon/charts`.
- ❌ Setting custom hex colors for series without using the palette / pairing options.
- ❌ Putting too many series on one chart (>7). Carbon's default palette has 14 distinct colors but readability degrades fast.
- ❌ Forgetting `theme` in `options` — chart looks wrong on dark backgrounds.
- ❌ Using `<canvas>`-based charts. Carbon Charts is SVG-based on purpose (better a11y, scaling, theming).
