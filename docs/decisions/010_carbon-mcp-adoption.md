# ADR 010 — Adopt the official Carbon MCP server as the live source of truth

**Status:** Accepted
**Date:** 2026-06-14

## Context

Carbon discipline on Flowstate has, until now, rested on the `carbon-builder`
skill — a static, point-in-time snapshot of Carbon conventions — plus the
implementer's and strategist's training memory. Both drift from the live
library: props get added behind feature flags, component composition changes
across v11 minor releases, and Carbon Charts' TypeScript option interfaces
(e.g. `TooltipOptions`) are not knowable from memory with confidence. This
caused real cost: in Phase 3.4 the tooltip-order investigation required reading
`@carbon/charts` `dist/*.d.ts` by hand to discover there was no sort callback,
and the strategist's Phase 3.3 prompt assumed Carbon-bundled fonts when the
project uses `next/font/google`.

The user was invited to the IBM Carbon MCP public preview and connected the
remote server (`https://mcp.carbondesignsystem.com/mcp`, added with
`--scope local` so the bearer token is not committed). Both roles — the
strategist (this conversation) and the implementer (a separate model) — can
call it. A short evaluation confirmed three tools:

- `docs_search` — usage, accessibility, style, do's-and-don'ts; returns live
  doc chunks with page URLs and crawl dates.
- `code_search` — **version-pinned** (e.g. v11.108.0) component props, variants,
  composition, imports, icons, pictograms. Surfaced, for example, that
  `StructuredList` now sits behind the `enableV12StructuredListVisibleIcons`
  feature flag — a fact the static snapshot could not guarantee.
- `get_charts` — the authoritative Carbon Charts retrieval, including a
  TypeScript options-interface lookup mode (`include_interfaces`).

## Decision

Adopt `carbon-mcp` as the **live IBM source of truth** for Carbon facts,
alongside (not replacing) `carbon-builder`:

- **`carbon-mcp` resolves facts** — does this prop/variant exist, what is the
  current composition, what is the chart options interface.
- **`carbon-builder` enforces discipline** — token-before-value,
  theme-over-palette, component-before-markup, the audit.

When the two appear to conflict, the MCP wins on the *fact* and `carbon-builder`
still governs *how* the fact is applied.

Operational rules:

1. Prefer the server over training memory for any Carbon component, token, or
   chart question; it is version-current.
2. For **anything** under Carbon Charts, `get_charts` is the only authoritative
   retrieval — never `code_search`, never reading `dist/*.d.ts`, never guessing
   the options shape. Use `include_interfaces` / `interface_names` for option
   types.
3. Every implementer prompt carries a mandatory **Carbon MCP** line declaring
   whether the server plays a role this phase and, if so, what to verify and
   the expectation to record findings in the session log (encoded in
   `flowstate-strategist` skill v1.2.0).
4. The bearer token lives only in the user's local MCP config (`--scope local`).
   Never commit it; if it leaks, rotate with IBM and re-add.

## Consequences

- Prompts that touch Carbon surfaces gain one short MCP-declaration line; the
  strategist uses the server to write grounded prompts, the implementer to
  verify before writing code.
- Carbon Charts work (the project's highest-churn Carbon surface) gets an
  authoritative options-interface lookup, eliminating the `dist/*.d.ts`
  spelunking seen in Phase 3.4.
- `carbon-builder` remains installed and load-bearing for project discipline;
  this ADR does not deprecate it.
- The server is a public **preview** and access may lapse. If it disconnects,
  fall back to `carbon-builder` + the library source; prompts should degrade to
  "MCP not available — verify against `node_modules/@carbon/*`" rather than
  block.
