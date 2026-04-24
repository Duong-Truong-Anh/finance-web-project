# 001 — Design system pivot: chromatic v1 → monochrome v2

## Context

The initial scaffold (2026-04-23) created `tokens.css` with a chromatic design system: a desaturated ochre accent (`--color-accent`), muted forest/rust for positive/negative values, and a 12-color category palette (`--color-cat-1` through `--color-cat-12`). Fonts were Source Serif 4 (serif) and Inter (sans). This was based on the v1 spec which allowed a single chromatic accent.

The spec was updated (2026-04-23) to adopt a full monochrome design posture for the MVP. PRD section 7.2 specifies a 7-token warm-ink-on-warm-paper tonal scale with zero hue. PRD section 3.3 explicitly lists chromatic color as a post-MVP extension.

## Decision

Replace the chromatic token set with the 7-token monochrome palette from PRD 7.2:

```
--canvas #F7F4EE  --paper #F0ECE4  --line #D9D3C6
--ink-subtle #A19B92  --ink-muted #57524C  --ink #1A1714  --ink-strong #0A0806
```

Deleted: `--color-accent`, `--color-accent-subtle`, `--color-positive`, `--color-negative`, `--color-cat-1..12`, `[data-theme="dark"]` chromatic block.

Replaced fonts: Source Serif 4 → **Fraunces** (variable, opsz+wght axes); Inter → **Outfit**. JetBrains Mono unchanged.

Chart differentiation moves from hue to `(tone, pattern)` pairs: 5 tonal steps from `--ink-subtle` to `--ink-strong` × 5 SVG patterns (solid, diagonal-stripe, dots, horizontal-stripe, crosshatch) = 25 distinguishable combinations.

Tokens are namespaced under `[data-theme="light"]` from day one so the post-MVP dark mode is a single additional block, not a retrofit.

## Consequences

- All future components reference only the 7 tonal tokens. Any code that uses a hex literal or an undefined token name is a bug.
- The `(tone, pattern)` lookup table for chart categories needs to be defined in the chart components before the Sankey or stacked area can be built.
- Dark mode is cheaper to add post-MVP than it would be on a chromatic product — it is a tonal inversion of the existing palette with warmth preserved.
- The font change (Fraunces/Outfit vs Source Serif 4/Inter) is a stronger editorial statement. Fraunces has genuine expressive range in its italic and optical-size axes; Source Serif 4 does not.
