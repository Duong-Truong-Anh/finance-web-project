# ADR 002 — Carbon Sass import via pre-compiled CSS (Turbopack workaround)

**Date:** 2026-04-28
**Status:** Accepted
**Deciders:** AI implementation partner

## Context

The Phase 0.1 spec calls for `app/globals.scss` to contain `@use '@carbon/styles'`, which compiles Carbon's full Sass source (tokens, resets, component styles) through Dart Sass.

When `bun run build` executes under Next.js 16.2.4 (Turbopack), the build fails with:

```
Error: Can't find stylesheet to import.
  @forward 'scss/config';
  node_modules/@carbon/styles/index.scss 8:1  @use
  app/globals.scss 1:1  root stylesheet
```

The file `node_modules/@carbon/styles/scss/_config.scss` **exists** — the path is correct. The failure is caused by `resolve-url-loader` (bundled inside Next.js's Sass pipeline) changing the file-context base directory when processing files inside `node_modules`, so Carbon's own relative `@forward 'scss/config'` paths cannot be resolved.

`sassOptions.includePaths` in `next.config.ts` does not resolve this; Turbopack's Sass handling does not honour `sassOptions` the same way webpack does.

## Decision

Load Carbon base styles via the pre-compiled CSS entry point instead of Sass:

```tsx
// app/layout.tsx
import '@carbon/styles/css/styles.css';
```

`globals.scss` keeps its `.scss` extension for future project-specific Sass (when we need `@use '@carbon/styles/scss/theme'` for custom token overrides). It does **not** contain `@use '@carbon/styles'`.

To make CSS custom properties (e.g. `--cds-background`) available at the document root (so `body { background-color: var(--cds-background) }` resolves correctly), add `className="cds--g90"` to the `<html>` element. The pre-compiled CSS includes `.cds--g90 { --cds-background: #262626; ... }` which scopes all g90 tokens at that selector.

## Consequences

### Positive

- Build succeeds. Dev server boots.
- All Carbon component styles load correctly.
- The `.cds--g90` selector approach is exactly what `<Theme theme="g90">` applies to its wrapper `<div>` — applying the same class to `<html>` is a supported pattern.
- No production difference in the rendered output.

### Negative

- We cannot use Sass-level Carbon APIs (`@use '@carbon/styles/scss/theme' with (...)` overrides) from `globals.scss` in this phase.
- When we need custom token overrides (future phase), we will need to revisit this — either by using Turbopack's Sass resolver workaround or by upgrading to a Next.js version where Turbopack's `sassOptions.loadPaths` is supported.
- The `globals.scss` comment mentions this ADR. Update or remove the comment when the Sass import is restored.

## Revisit trigger

When Next.js Turbopack fully supports `sassOptions.includePaths` / `loadPaths` for node_modules Sass resolution, replace the CSS import with `@use '@carbon/styles'` in `globals.scss` and remove the `className="cds--g90"` from `<html>` (it will be provided by the `<Theme>` wrapper at run time).
