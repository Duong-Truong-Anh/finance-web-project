# ADR 011 — Spacing tokens are not runtime CSS variables; use Carbon layout components or documented literal rem

**Date:** 2026-06-17
**Status:** Accepted
**Deciders:** AI implementation partner

## Context

Carbon discipline rule 1 (CLAUDE.md) instructed every spacing value to be a Carbon
token applied as `style={{ padding: 'var(--cds-spacing-05)' }}`. Session 42 discovered
this pattern is a **silent no-op** in this build.

Per **ADR 002**, Carbon is loaded as pre-compiled CSS (`@carbon/styles/css/styles.css`)
rather than compiled from Sass, because Turbopack cannot resolve Carbon's internal
`@forward` paths. The pre-compiled CSS exposes the **color** theme tokens as runtime
custom properties scoped under the theme class (`.cds--g90 { --cds-text-primary: … }`),
but it does **not** emit the spacing scale (`--cds-spacing-01 … --cds-spacing-13`) as
runtime custom properties. Those tokens only exist as Sass variables, which we cannot
`@use` (the same `@forward 'scss/convert'` loader failure ADR 002 documents).

Consequently every `var(--cds-spacing-*)` reference in an inline style resolves to an
**empty value**, which CSS treats as `0px`. The app still looked acceptable because
Carbon component defaults (Tile padding, Button padding), the 2x Grid, and `<Stack>`
gaps carried the visible rhythm — masking ~80 dead declarations across the codebase.

### Browser-probe evidence (g90, `localhost:3000`)

```json
{
  "rootSpacing05": "",            // getPropertyValue('--cds-spacing-05') on :root → empty
  "rootSpacing07": "",            // empty
  "rootTextPrimary": "#f4f4f4",   // color token DOES resolve
  "h1MarginBlockEnd": "0px",      // h1 with marginBlockEnd: var(--cds-spacing-07) → 0px
  "divPaddingFromSpacingVar": "0px" // fresh div padding: var(--cds-spacing-07) → 0px
}
```

## Decision

Apply spacing through mechanisms that compile to a real value, not through
`var(--cds-spacing-*)` inline styles:

1. **`<Stack gap={n}>`** for the vertical (or `orientation="horizontal"`) rhythm
   between sibling elements. Carbon compiles the `gap` prop to a real length via its
   own `--cds-stack-gap` custom property, which the pre-compiled CSS *does* emit. The
   number maps to the spacing step (`gap={5}` → `$spacing-05` → `1rem`).
2. **`<Grid>` / `<Column>`** for page layout and column gutters.
3. **A documented literal `rem`** equal to the Carbon token, with a comment naming the
   token, for the rare standalone case (a single border offset, a tile's own padding,
   a min-block-size floor) where no layout component fits. Example:
   `padding: '3rem' /* --cds-spacing-09 */`. These values are theme-independent, so a
   literal stays portable. This matches the `.flowstate-dashboard-hero` precedent in
   `app/globals.scss` (Session 42).

Color and type tokens are unaffected and remain mandatory: `var(--cds-text-primary)`,
`var(--cds-support-error)`, `cds--type-*`, etc. all resolve correctly and must still be
used. CLAUDE.md Carbon-discipline rule 1 is amended to state this distinction.

The remediation is **appearance-preserving**: where a no-op declaration computed to
`0px` and the rendered rhythm was already carried by component defaults, the dead
declaration is simply removed; where the intended spacing was load-bearing and the
`0px` was a visible defect (e.g. a skeleton tile with no reserved height, empty-state
content hugging the tile edge), the intended literal value is applied. Before/after
screenshots prove no section moved except where intent was deliberately restored.

## Consequences

### Positive

- Spacing becomes real and inspectable instead of a silent `0px`.
- The pattern is Carbon-native (`<Stack>`/`<Grid>`) for the common case, with a small,
  documented literal escape hatch for standalone padding/border.
- Future code (and future prompts) stop reproducing the no-op, because rule 1 now
  describes reality.

### Negative

- Existing visual rhythm relied on defaults; some sections sit closer than the original
  token values implied. Restoring those to the intended spacing is a deliberate redesign
  decision, out of scope here — cramped rhythm is **noted, not fixed** in this phase.
- `@carbon/layout` Sass tokens (`$spacing-*`) remain unavailable in `globals.scss` for
  the same loader reason ADR 002 documents. The literal-rem escape hatch is the
  workaround until the Sass pipeline is restored.

## Revisit trigger

When ADR 002's Sass import is restored (Turbopack resolves Carbon's `@forward` paths),
`@use '@carbon/layout'` becomes available and `$spacing-*` Sass tokens can replace the
documented literal rems in `globals.scss`. The `<Stack>`/`<Grid>` mechanisms remain
correct regardless.
