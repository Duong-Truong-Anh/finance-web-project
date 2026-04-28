# AI Process Log — Flowstate (Carbon revision)

## Assignment Overview

Build a personal/business cash flow management website with long-term stock investment simulation, using AI software as a supporting tool. The website records monthly inflows/outflows, computes net cash flow, allocates 30–50% of it across a 5-stock portfolio for the first 5 years, and projects portfolio value at 10/20/30 years under three deterministic growth scenarios (15%, 17.5%, 20%).

This log is a graded deliverable. Each session entry documents what was asked of the AI, what the AI did, what the student verified, and the decisions made.

The **pre-Carbon history** (V1 vanilla bento dashboard, Flowstate v0 hand-built monochrome) is preserved at `docs/archive/AI-PROCESS-LOG-pre-carbon.md`. The current product (Flowstate v1) is built on IBM Carbon Design System; the pivot rationale is in `docs/decisions/001_pivot-to-carbon.md`.

---

## AI Tools Used

| Tool | Purpose |
|---|---|
| Claude Code (claude-opus-4-7) | Primary implementation partner — spec authoring, architecture, code generation, debugging |
| `carbon-builder` skill | Carbon Design System discipline (token, component, theme, grid rules) |
| `kpi-dashboard-design` skill | Reference for the Dashboard KPI tile composition |
| `financial-reporting-dashboard` skill | Reference for the Reports page and printable summary |
| `d3-viz` skill | On standby for the stretch-goal Sankey chart (D3 escape from Carbon Charts) |

---

## Session 1 — Spec creation under Carbon (2026-04-28)

### What I asked the AI to do

- Become the spec author for the new Carbon-based Flowstate.
- Analyze the current (post-reset) folder structure.
- Ask clarifying questions before drafting.
- Once I confirmed direction, draft the full spec set: overview, IA, data model, calculation, feature spec, design system spec — plus an updated CLAUDE.md and a fresh AI-PROCESS-LOG.

### What I (the student) decided

The AI offered fast defaults across 18 dimensions, then asked for my answers. I picked:

- **Identity:** stock chromatic Carbon (no monochrome override). Embrace the IBM-product look. Default theme **g90**, toggleable to g100 / white.
- **Posture:** precise grid-first, exact Carbon spacing — the previous "anti-AI editorial" posture is retired.
- **Stack:** `@carbon/react` + Next.js + Bun.
- **Persistence:** LocalStorage now, with a Repository abstraction designed for a future WorkOS-backed sync.
- **IA:** Carbon UI Shell with SideNav. Pages: Dashboard (single-page condensed) · Cash Flow (income + expenses combined) · Simulation · Reports · Settings.
- **5-year mental model survives** — months 1–60 are contribution; months 61–360 are compounding.
- **Live tickers via Finnhub** (server-side; key off the client).
- **Currency:** VND/USD selectable with **real FX conversion** via `open.er-api.com`, daily-cached.
- **Projection:** **three deterministic lines** at 15% / 17.5% / 20% (the assignment asks for "15–20%"; showing all three preserves the information). Milestones at 10/20/30 years displayed in Carbon Tiles.
- **Scope:** robust production-ready mini app.
- **Reports:** dedicated page covering screenshot capture, exports, and a printable one-page summary.

### What the AI did this session

1. Detected Carbon mode (standalone — no Carbon MCP server connected; using embedded references).
2. Read the existing CLAUDE.md and AI-PROCESS-LOG (pre-Carbon).
3. Wrote six spec documents under `docs/`:
   - `00_overview.md` — product, audience, posture, stack, success criteria, glossary.
   - `01_information_architecture.md` — UI Shell, page map, header/SideNav anatomy, Next.js routing, empty/error policy, keyboard model.
   - `02_data_model.md` — entities, money discipline, Zod schemas, Repository interface, LocalStorage adapter, CSV round-trip, future-sync seam.
   - `03_calculation_spec.md` — net cash flow, contribution phase, compounding phase, three-line projection, milestone math, FX rules, worked example, edge cases, performance budget.
   - `04_feature_spec.md` — page-by-page behavior with Carbon component callouts (Onboarding, Dashboard, Cash Flow, Simulation, Reports, Settings) plus the cross-cutting Finnhub and FX integration sections.
   - `05_design_system_spec.md` — token discipline, theme strategy, components in/out of scope, type, color, status, spacing, charts (Carbon-first / D3-with-justification), motion, icons, a11y floor, audit checklist, license.
4. Wrote `docs/decisions/001_pivot-to-carbon.md` (Context → Decision → Consequences for the Carbon adoption).
5. Replaced `CLAUDE.md` with the Carbon-native working agreement (the previous monochrome/Fraunces rules retired).
6. Archived the pre-Carbon log to `docs/archive/AI-PROCESS-LOG-pre-carbon.md`.

### Key decisions captured

- **Three-line projection** instead of single-rate. The brief asks for "15–20%"; collapsing to one number throws away half the input. Showing all three gives the report a low/mid/high case to discuss.
- **Stock chromatic Carbon, not custom-themed Carbon.** Avoids fighting the design system. Re-themes for free across g90 / g100 / white. Demo talking point: "Built on IBM's open-source design system."
- **Repository abstraction kept from the abandoned v0.** This was the one architectural decision worth carrying forward — it gives a clean WorkOS-sync future without rewriting features.
- **Carbon Charts first; D3 only with justification.** Carbon Charts ships theming, accessibility, tooltips, downloads, and responsive behavior. The Sankey-style decomposition (if added as a stretch goal) is the only real D3 candidate.

### What I understand and can explain

- Why three deterministic growth lines are more faithful to the brief than a single rate.
- Why money is integer minor units + currency tag (avoiding float rounding bugs across multi-currency display).
- Why the projection engine is a pure function in `src/lib/projection/` with no React import — testability and the option to run it in a worker later.
- Why the Repository pattern lets the app keep working when LocalStorage swaps for a remote DB.
- Why the Finnhub key never reaches the client — Next.js route handlers proxy and add the key from `process.env` or a request header sourced from Settings.
- Why Carbon's `support-*` tokens (paired with icons) are the canonical way to show error/warning/success state, not raw red/yellow/green.

### Skills referenced this session

- `carbon-builder` — sourced the four hard Carbon rules (token-before-value, component-before-markup, theme-over-palette, grid-for-page) and the audit checklist.

### Next session

Implementation of Phase 0:

1. `bun create next-app` with App Router + TypeScript + Tailwind off (we use `@carbon/styles`).
2. Install Carbon packages: `@carbon/react`, `@carbon/styles`, `@carbon/icons-react`, `@carbon/charts-react`, `@carbon/pictograms-react`.
3. Wire the `<Theme>` wrapper, `<Header>`, `<SideNav>`, and route stubs.
4. ESLint boundary rule: `no-restricted-imports` blocks any `react`, `next`, or `*.tsx` import from inside `src/lib/`.
5. Vitest setup; one passing test in `src/lib/projection/`.

---

<!-- New session entries below this line. Format: heading "Session N — Title (YYYY-MM-DD)", subsections "What I asked", "What the AI did", "What I understand", "Next session". -->

## Session 2 — Phase 0.1: Next.js scaffold + Carbon install + g90 empty Dashboard (2026-04-28)

### What I asked the AI to do

Initialize the Next.js App Router project from scratch, install Carbon Design System (`@carbon/react`, `@carbon/styles`, `@carbon/icons-react`, `sass`), wire a root `<Theme theme="g90">` wrapper, and render a minimal Dashboard page with a Carbon `<Header>` showing only the "Flowstate" wordmark on a g90 dark background with IBM Plex Sans typography. No SideNav, no routes, no lib layer — just proving Carbon is installed, themed, and rendering correctly.

### What the AI did this session

1. Read all required spec sections: `CLAUDE.md`, `docs/00_overview.md` §5 + §7, `docs/01_information_architecture.md` §1 + §5, `docs/05_design_system_spec.md` §1 + §2 + §5 + §12, and `docs/decisions/001_pivot-to-carbon.md`.
2. Scaffolded Next.js 16.2.4 (App Router, TypeScript, no Tailwind, no ESLint, no src-dir) in a temp directory and copied the generated files to the repo root, preserving `CLAUDE.md`, `AI-PROCESS-LOG.md`, `docs/`, and `skills-lock.json`.
3. Installed `@carbon/react@1.106.0`, `@carbon/styles@1.105.0`, `@carbon/icons-react@11.79.0`, `sass@1.99.0`.
4. Created the following files:
   - `app/layout.tsx` — root layout with `<Theme theme="g90">`, IBM Plex CDN link, CSS import for Carbon styles, `className="cds--g90"` on `<html>` for root-level token scope.
   - `app/page.tsx` — Dashboard page: Carbon `<Grid>` + `<Column sm={4} md={8} lg={16}>` + `<h1 className="cds--type-productive-heading-04">Dashboard</h1>`.
   - `app/globals.scss` — body/html reset using `var(--cds-background)` and `var(--cds-text-primary)`.
   - `app/components/AppHeader.tsx` — `'use client'` Carbon `<Header aria-label="Flowstate">` with `<HeaderName href="/" prefix="Flow">state</HeaderName>`.
   - `THIRD_PARTY_NOTICES.md` — Apache-2.0 and OFL attributions for Carbon and IBM Plex.
   - `next.config.ts` — `transpilePackages` for `@carbon/react`, `turbopack.root` to silence the lockfile workspace-root warning.
5. Discovered and resolved a build-blocking issue (see Judgment Calls below).
6. Verified all acceptance criteria pass.

### Judgment calls and ambiguities

**Turbopack Sass resolution (ADR 002):** The spec calls for `@use '@carbon/styles'` in `globals.scss`. Under Next.js 16 (Turbopack), `resolve-url-loader` changes the file-context base path for Sass files inside `node_modules`, causing Carbon's own relative `@forward 'scss/config'` to fail. `sassOptions.includePaths` is not honoured by Turbopack's Sass pipeline. Workaround: import `@carbon/styles/css/styles.css` (Carbon's pre-compiled CSS) directly in `layout.tsx`. The pre-compiled file includes `.cds--g90 { --cds-background: #262626; ... }` theme selectors, so all Carbon CSS custom properties are available. `globals.scss` retains its `.scss` extension for future project-specific Sass. Documented in `docs/decisions/002_carbon-sass-turbopack.md`.

**`className="cds--g90"` on `<html>` instead of only on `<Theme>` wrapper:** The Carbon `<Theme theme="g90">` renders a `<div class="cds--g90 cds--layer-one">` inside `<body>`. CSS custom properties don't cascade *up* the DOM, so `body { background-color: var(--cds-background) }` in `globals.scss` would resolve to the `:root` white-theme default without an ancestor that defines the g90 tokens. Adding `className="cds--g90"` to `<html>` scopes the g90 tokens at root level. The `<Theme>` wrapper is still present and still provides the React context boundary for Carbon components. In a later phase (theme switching), middleware will read a cookie and pass the correct class to `<html>` on the server side.

**`next.config.ts` instead of `next.config.mjs`:** The scaffold generates `.ts` by default in Next.js 16 and it works identically. No change needed.

### Acceptance criteria verified

- [x] `bun run dev` boots without errors — ready in 354ms.
- [x] `bunx tsc --noEmit` — zero errors.
- [x] `bun run build` — static generation succeeds for `/` and `/_not-found`.
- [x] Rendered HTML at `localhost:3000` contains `<html class="cds--g90">`, `<header aria-label="Flowstate" class="cds--header">`, `<a class="cds--header__name">` with "Flow" prefix and "state", `<h1 class="cds--type-productive-heading-04">Dashboard</h1>`.
- [x] `grep -rE '#[0-9a-fA-F]{3,8}' app/ THIRD_PARTY_NOTICES.md` — zero authored hex literals.
- [x] `grep -rE '\b[0-9]+px\b' app/` — zero authored px literals.
- [x] No Tailwind in `package.json`.
- [x] `THIRD_PARTY_NOTICES.md` exists at repo root.

### What I understand and can explain

- Why `@use '@carbon/styles'` fails under Turbopack and why the pre-compiled CSS is a correct functional equivalent for Phase 0.1.
- Why `className="cds--g90"` on `<html>` is needed for `var(--cds-background)` to cascade to `<body>` — CSS custom properties only inherit down, not up.
- Why `<Theme theme="g90">` is still needed alongside the `<html>` class — it provides the React context that Carbon's interactive components consume internally.
- Why `<HeaderName>` needs `href="/"` — without it, Carbon renders a bare `<a>` with no href, which is not semantically valid.
- Why `transpilePackages` is required in `next.config.ts` — Carbon's packages publish ESM with subpath exports; Next.js needs to transpile them rather than treating them as pre-compiled CommonJS.

### Skills referenced this session

- `carbon-builder` — Carbon token / component / theme discipline enforced throughout.

### Next session

Phase 0.2:
1. ESLint setup with `no-restricted-imports` boundary rule blocking UI deps from `src/lib/`.
2. Vitest configuration; one passing test for the (future) projection engine stub.
3. Optionally: begin `src/lib/` data model stubs (Repository interface, Zod schemas, money type).

