// Single scenario color identity for the projection LINE charts (ADR 012).
//
// The Low/Mid/High scenarios must read as ONE color per scenario across the
// chart series, the tooltip swatch (Carbon derives both from this same scale),
// and the MilestoneGrid Tags — green = Low, blue = Mid, purple = High.
//
// These deliberately override Carbon's data-vis palette for these two charts
// (CLAUDE.md Carbon-discipline rule 3 / spec §6.3), authorized by ADR 012. The
// per-asset stacked-area chart keeps the data-vis palette and does NOT use this.
//
// Why the FOREGROUND `--cds-tag-color-*` token (not `--cds-tag-background-*`):
// the tag tokens invert by theme, and the foreground token is the one whose
// inversion is contrast-appropriate to the chart surface in every theme —
// light hue on g90/g100's dark plot, dark hue on white's light plot. The pale
// `--cds-tag-background-*` would render a near-invisible line. Identity is by
// hue family (green/blue/purple), shared with the Tag, not pixel-equality with
// the Tag's pill fill. These are runtime CSS vars (theme-safe), unlike spacing.
//
// Ordered Low → Mid → High to match each chart's SCENARIO_LABELS index.
export const SCENARIO_LINE_COLORS = [
  'var(--cds-tag-color-green)', // Low
  'var(--cds-tag-color-blue)', // Mid
  'var(--cds-tag-color-purple)', // High
] as const;
