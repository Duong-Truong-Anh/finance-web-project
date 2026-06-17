# ADR 012 — One scenario color identity on the projection line charts (green Low / blue Mid / purple High), overriding the data-vis palette

**Date:** 2026-06-17
**Status:** Accepted
**Deciders:** AI implementation partner (strategist-approved)

## Context

The projection scenarios (Low / Mid / High growth) are presented on three surfaces
that a user reads as one object:

1. The **MilestoneGrid Tags** (`src/features/simulation/MilestoneGrid.tsx`) —
   `<Tag type="green">` Low, `<Tag type="blue">` Mid, `<Tag type="purple">` High.
2. The **line chart series** on Simulation (`SimulationProjectionChart`) and Dashboard
   (`ProjectionLineChart`).
3. The **tooltip swatches** on those charts (Carbon derives the swatch from the same
   color scale that draws the series).

Per spec §6.3 / CLAUDE.md Carbon-discipline rule 3, the line charts used Carbon's
default `data-vis` palette (g90 positions 1–3 ≈ purple / teal / white). The Tags use
the Carbon tag color tokens (green / blue / purple). Only the **reading order** was
reconciled (Phase 3.4: Low → Mid → High in both). The result: the same scenario carried
**two color identities** — a tooltip swatch and its corresponding milestone Tag were
different colors. "Low" was teal-ish in the chart but green in the grid; the user had to
re-map color → scenario when their eye moved between surfaces. This is exactly the
cross-surface inconsistency flagged in Session 39.

### Why the data-vis-palette rule does not serve this case

Rule 3 ("differentiate chart series by the data-vis palette; custom colors break theme
parity") exists to guarantee theme parity for free. Here it actively *creates* an
inconsistency, because the reference identity (the Tags) is set by a *different* token
family that the user sees side-by-side with the chart. Theme parity is still required;
the data-vis palette is not the only way to get it.

## Decision

Adopt a **single scenario color identity** across the line-chart series, their tooltip
swatches, and the MilestoneGrid Tags: **green = Low, blue = Mid, purple = High.** This
deliberately overrides Carbon's data-vis palette for these two charts.

Implementation:

- A shared constant `src/components/charts/scenario-colors.ts` exports
  `SCENARIO_LINE_COLORS = ['var(--cds-tag-color-green)', 'var(--cds-tag-color-blue)',
  'var(--cds-tag-color-purple)']` in Low → Mid → High order — the single source of the
  identity, so the two charts cannot drift.
- Each chart sets `options.color.scale` (the Carbon Charts per-group color map,
  confirmed via `carbon-mcp` `get_charts`: `LineChartOptions.color.scale` is a
  `{ [group]: colorString }` object) keyed by **its own** `SCENARIO_LABELS` strings —
  which differ between the two charts (`'Low (15%)'…` vs `'15% growth'…`) — zipped with
  `SCENARIO_LINE_COLORS` by index. Setting the scale recolors the series **and** the
  tooltip swatch from one change, so cross-surface match falls out per chart.

### Theme-safety via the FOREGROUND tag token, not the pill background

The colors are sourced from Carbon tag tokens, which the pre-compiled CSS emits as
**runtime CSS custom properties** scoped per theme (unlike the spacing scale — ADR 011),
so `var(--cds-tag-color-green)` re-resolves correctly in g90 / g100 / white. Carbon
Charts applies scale colors to SVG via CSS, where `var()` resolves (the existing
threshold `fillColor: 'var(--cds-text-secondary)'` and spec §8.3's `var(--cds-charts-1)`
are the same mechanism).

The tag tokens **invert** by theme:

| Token | white / g10 | g90 / g100 |
|---|---|---|
| `--cds-tag-color-green` (foreground) | `#0e6027` (dark) | `#a7f0ba` (light) |
| `--cds-tag-background-green` (pill fill) | `#a7f0ba` (light) | `#0e6027` (dark) |

We use the **foreground** `--cds-tag-color-*` token. Its inversion is exactly the
direction a chart line needs: a light hue on g90/g100's dark plot, a dark hue on white's
light plot — contrast-appropriate to the chart surface in every theme by construction.
The pale `--cds-tag-background-*` would render a near-invisible line in light themes. The
match is therefore by **hue identity** (green / blue / purple), shared with the Tag — not
pixel-equality with the Tag's muted pill fill. Users read a Tag's color identity from its
saturated text/border anyway, so the identity holds.

## Consequences

### Positive

- One scenario = one color across chart series, tooltip swatch, and Tag, in all three
  themes. The Session 39 cross-surface inconsistency is closed.
- Theme parity is preserved because the colors are tokens, not hand-picked hex; they
  re-resolve per theme like every other Carbon token.
- The identity lives in one constant, so the two charts cannot diverge.

### Negative / scoped

- This is a scoped deviation from Carbon-discipline rule 3 / spec §6.3, limited to the
  two **scenario line charts**. CLAUDE.md rule 3 and spec §6.3/§8 carry a pointer to this
  ADR so the deviation is legible as a decision, not drift.
- The **per-asset stacked-area chart** (`PerAssetStackedAreaChart`) is per-asset, not
  per-scenario, and is **out of scope** — it keeps the data-vis palette. The override is
  semantic (scenario identity), not a blanket "charts use tag colors" rule.
- Blue (Mid) and purple (High) sit near each other on the hue wheel; as thin lines they
  are closer than as Tag pills. Verified mutually distinguishable in all three themes;
  the series also carry legend + tooltip text labels (so scenario identity is never
  color-alone for a11y).

## Revisit trigger

If Carbon's tag color tokens are restructured, or if a future scenario count exceeds the
three tag hues with a clean semantic mapping, revisit `scenario-colors.ts`. The
`color.scale` mechanism and the per-chart keying remain correct regardless.
