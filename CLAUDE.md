# Flowstate — Working Agreement (Carbon-native)

You are the implementation partner on Flowstate, a personal cash flow management website with a long-term stock investment simulator. The product is built on IBM Carbon Design System. Read this file at the start of every session. The specs in `docs/` are the source of truth; this file is the operating manual.

## Required reading order

0a. **`PRODUCT.md`** — users, brand personality, design principles, anti-references. Read before any UI task.
0b. **`DESIGN.md`** — Named Rules (Signal Rule, No-Shadow Rule, Tonal Depth Rule, etc.), component specs, §6 Do's and Don'ts. Read before any UI task.
1. **`docs/00_overview.md`** — what the product is, the audience, the design posture, the success criteria. Always.
2. **`docs/04_feature_spec.md` § (the section you're working on).** Sections are numbered; the user will name the section.
3. **`docs/01_information_architecture.md`** if the task touches navigation, page layout, or routing.
4. **`docs/02_data_model.md`** if the task touches persistence, validation, or money handling.
5. **`docs/03_calculation_spec.md`** if the task touches the projection engine, FX, or any number that goes on screen.
6. **`docs/05_design_system_spec.md` § 12 (audit checklist)** before opening a PR. Every time.

## Before any task

- **Cap initial codebase exploration at ~5–8 file reads before producing a plan.** If more context is needed after that, write a brief "I need to read X, Y, Z because…" note and confirm scope before continuing. Prefer Glob/Grep for structural scans over reading whole files. Sessions that burn the entire context budget on file reading produce nothing.

1. State in 3 sentences what you understand the task to be. Flag ambiguity before writing code. Do not guess.
2. Propose a plan: files to create, files to modify, order of operations, tests to write, Carbon components and tokens to use. Wait for confirmation.
3. Then write code.

## Hard rules — violations block the PR

### Carbon discipline (load-bearing)

1. **Token before value.** Every color, spacing, type, motion, and breakpoint value is a Carbon token. No raw hex (`#161616`). No arbitrary px (`padding: 18px`). No ad-hoc media queries (`@media (min-width: 768px)`). No ad-hoc font sizes. Use `var(--cds-text-primary)`, `var(--cds-spacing-05)`, `@include layout.breakpoint('lg')`, `@include type.type-style('label-02')`. The full token discipline lives in `docs/05_design_system_spec.md` § 1.
2. **Component before markup.** If Carbon ships it, you use it. No hand-rolled buttons, inputs, modals, dropdowns, tables, notifications, tags, tabs, tiles, sliders, toggles. The component inventory in scope is in `docs/05_design_system_spec.md` § 3.
3. **Theme over palette.** Code uses theme tokens (`text-primary`, `layer-01`, `support-error`) so all four Carbon themes work for free. Default is **g90**. Raw palette steps (`blue-60`, `gray-100`) are reserved for chart series colors and a small set of decorative cases.
4. **Grid for page; flex/grid for component.** Carbon's 2x Grid (`<Grid>` + `<Column>`) lays out every page. Native flex/grid is fine inside one component. No raw `<div className="flex">`-everything page layouts.
5. **Status uses color + icon.** `<InlineNotification>`, `<Tag>` with `renderIcon`, etc. Color is never the only channel.
6. **Charts: Carbon Charts first.** `@carbon/charts-react` for line/bar/area/combo. D3 only when Carbon Charts cannot express the visual, and only with the wrapper rules in `docs/05_design_system_spec.md` § 8.

### Architecture (load-bearing)

1. **`src/lib/` has zero UI dependencies.** No React imports, no JSX. Enforced by an ESLint boundary rule.
2. **Data access goes through `Repository` interfaces** defined in `src/lib/transactions/`, `src/lib/portfolio/`, `src/lib/settings/`. **Never call `localStorage` directly from UI code.**
3. **The projection engine (`src/lib/projection/`) is a pure function.** Same input, same output. No `Date.now()`. No `Math.random()`. No I/O.
4. **Money is integer minor units + currency tag.** `{ amount: 50000000, currency: 'VND' }`. Never floats. Never bare numbers as money.
5. **Form schemas are Zod.** The same schema validates UI input and CSV imports.
6. **Finnhub key is never on the client.** All ticker calls go through Next.js route handlers.
7. **Static analysis is part of the verification loop.** `bun run fallow:check` must pass before a PR. Fallow enforces zone-to-zone boundaries (`src/lib/` may only import from `src/lib/`; `features/` composes `components/` and `lib/`; etc.), unresolved imports, circular dependencies, and duplicate exports. Unused-code and complexity findings are surfaced as warnings against a baseline; address only in dedicated cleanup phases. The fallow Agent Skill is installed at `.claude/skills/fallow/` and is invoked automatically when an implementer asks "find dead code", "check boundaries", "audit health", etc.

### Process

1. One feature per branch, one feature per PR. PR description cites the feature spec section number.
2. Never add a dependency without justifying it in the plan step. Bundle-size-conscious alternatives preferred.
3. Tests: Vitest for `src/lib/` (especially `src/lib/projection/`), Playwright for critical user paths. A feature without tests is not done.
4. Update `AI-PROCESS-LOG.md` at the end of every session with a dated entry.
5. Add a short ADR at `docs/decisions/NNN_short-slug.md` for any judgment call not covered by the specs. Format: Context → Decision → Consequences.

## Before marking work complete

- TypeScript passes with no errors (`bunx tsc --noEmit`).
- Lint passes (`bun run lint`).
- Tests pass (`bun run test`).
- Lighthouse accessibility score ≥ 95 on any page you touched.
- The audit checklist in `docs/05_design_system_spec.md` § 12 is run mentally — every item ticked or marked N/A with a reason.
- The screenshot test: capture the result, view it in **all three themes** (g90, g100, white). Theme leak bugs (a hardcoded background that survives theme switch) are common and embarrassing.
- Update `docs/04_feature_spec.md` if you discovered an ambiguity that should be reflected in the spec.
- **Verify the PR base branch is `master`** (not the previous phase branch) before clicking Create. The default in GitHub's UI sometimes auto-selects the most recent feature branch. A wrong-base-branch merge requires a forward-merge recovery PR. Run `gh pr view` or visually confirm in the GitHub compare URL.
- Add the session entry to `AI-PROCESS-LOG.md` — see **"Updating AI-PROCESS-LOG.md"** below for the template, the append-marker rule, and the index-row rule.

## Updating AI-PROCESS-LOG.md

`AI-PROCESS-LOG.md` is a graded deliverable, a cold-start retrieval substrate for future implementer agents, and a project memory that survives conversation resets.

### Append rule

Find the marker near the bottom of the file and place the new session block **immediately above** it:

```
<!-- APPEND NEW SESSION ENTRIES ABOVE THIS LINE -->
```

Never insert entries anywhere else in the file.

### Index rule

When adding a new session, also append one row to `## Session Index` at the top of the file. Format:

```
- Session N — Phase X.Y — Short title — YYYY-MM-DD
```

Addendum rows are indented two spaces under their parent:

```
  - Session N (addendum) — Phase X.Y — Short subtitle — YYYY-MM-DD
```

### Canonical session template

```markdown
## Session N — Phase X.Y: <title> (YYYY-MM-DD)

### What I asked the AI to do

_User's framing in 2–3 sentences._

### What the AI did

_Bulleted list of changes, grouped by file or concern._

### Spec drift / discrepancies / things noticed

_Ambiguities resolved, implementation divergences, or things observed but not fixed. Write "None." if nothing applies._

### Quality gates

| Gate | Result |
|---|---|
| `bunx tsc --noEmit` | |
| `bun run lint` | |
| `bun run test` | |
| `bun run e2e` | |
| `bun run build` | |
| `bun run fallow:check` | |

_(Omit rows for gates that don't apply to this session.)_

### [Optional] Phase-specific section — e.g. "Exact pinned values", "Baseline finding counts"

### [Optional] PR review triage — Copilot / human review comments worth recording

### Recommendation for next session

_One paragraph. Always present. Always last._
```

### Addendum rule

Use `## Session N (addendum) — Phase X.Y: <subtitle> (YYYY-MM-DD)` when the same branch / PR receives small follow-up work after the main session was written. Number further addenda `(addendum 2)`, `(addendum 3)`. A genuinely new task on a different branch is a new session, not an addendum. Each addendum gets its own index row, indented under its parent.

### Historical sessions

Sessions 1–18 are not rewritten. This standard applies to Session 19 onward.

## Common pitfalls to avoid

- **Reaching for shadcn / Radix / Material because "Carbon doesn't have X."** It probably does. Check `docs/05_design_system_spec.md` § 3 first. If it really doesn't, the question is whether Flowstate needs the feature, not what library to add.
- **Adding a hex code "just for one thing."** No. Theme/palette tokens or nothing.
- **Hand-rolling a `<button className="...">`.** Use `<Button>`. Always.
- **Putting `localStorage.getItem(...)` in a React component.** No. Repository.
- **Letting the projection engine import React.** No. Pure function.
- **Computing money with floats.** No. Integer minor units.
- **Using `support-error` for "this number is negative" without an icon or minus glyph.** Status pairs color with another channel.
- **Skipping the `<Theme>` wrapper.** The whole app is themed by the root `<Theme>`. New surfaces nested in a different theme use `<Theme theme="...">` explicitly.
- **Differentiating chart series by anything other than Carbon's data-vis palette.** Custom colors break theme parity.
- **Writing copy as lorem ipsum or AI-generic ("Welcome to your dashboard! Get started by..."). Empty-state copy is concrete, sourced templates in `docs/04_feature_spec.md`.
- **Adding analytics, tooltips on body text, or "helpful" walkthroughs that aren't in the spec.** Don't.
- **Storing the Finnhub key in client-readable code.** It lives in Settings (LocalStorage, user-supplied) or `process.env` (server-only). Never in source.

## What to do when you're stuck or unsure

- If the spec is silent, **ask**. Do not improvise architecturally significant decisions.
- If you believe the spec is wrong, say so explicitly and propose the change. The spec is a living document; changes are deliberate, not by drift.
- If a task feels larger than one session, propose a decomposition. One session, one feature.

## Repo map

```
app/                              # Next.js App Router
├── layout.tsx                    # <Theme>, <Header>, <SideNav>, <Content>
├── page.tsx                      # / (Dashboard)
├── cash-flow/page.tsx
├── simulation/page.tsx
├── reports/page.tsx
├── settings/page.tsx
├── onboarding/page.tsx
├── api/
│   ├── tickers/{search,quote}/route.ts
│   └── fx/latest/route.ts
├── error.tsx
└── not-found.tsx

src/
├── lib/                          # Pure logic. Zero UI deps. ESLint-enforced.
│   ├── projection/               # Pure projection engine (3-line, deterministic).
│   ├── transactions/             # Repository + LocalStorage adapter + Zod schemas.
│   ├── portfolio/                # PortfolioConfig repository.
│   ├── settings/                 # Settings repository.
│   ├── currency/                 # Money type, convert(), format(), FX cache.
│   ├── csv/                      # parseCsv / serializeCsv. Round-trip-tested.
│   └── storage/                  # LocalStorage adapter, migrations.
├── features/                     # Feature-level modules. Compose Carbon + lib.
│   ├── cash-flow/
│   ├── simulation/
│   ├── reports/
│   └── onboarding/
└── components/                   # Cross-feature UI helpers (NOT primitives).
    ├── shell/                    # <FlowstateHeader>, <FlowstateSideNav>.
    ├── charts/                   # Carbon Charts wrappers + any D3 escape.
    └── empty-states/             # Per-page empty-state compositions.

docs/
├── 00_overview.md
├── 01_information_architecture.md
├── 02_data_model.md
├── 03_calculation_spec.md
├── 04_feature_spec.md
├── 05_design_system_spec.md
├── decisions/                    # ADRs. 001 = pivot to Carbon.
└── archive/                      # Historical docs (pre-Carbon AI log).

AI-PROCESS-LOG.md                 # Per-session AI usage record (graded artifact).
THIRD_PARTY_NOTICES.md            # Carbon Apache-2.0 attributions.
CLAUDE.md                         # This file.
```

## Stack quick reference

- **Framework:** Next.js (App Router)
- **Runtime:** Bun
- **UI:** `@carbon/react` + `@carbon/styles`
- **Charts:** `@carbon/charts-react` (D3 only with justification)
- **Icons:** `@carbon/icons-react`, `@carbon/pictograms-react`
- **Type:** IBM Plex Sans / Serif / Mono
- **Validation:** Zod
- **Persistence:** LocalStorage behind a Repository (future-sync-ready)
- **Tests:** Vitest (`src/lib/`), Playwright (E2E)
  - **Vitest does not resolve `@/` path aliases.** Use relative imports (`../`) in any file imported by a `*.spec.ts`. Next.js, ESLint, and TypeScript all resolve `@/` correctly; only Vitest is the exception.
- **Lint:** ESLint with `no-restricted-imports` boundary on `src/lib/`

## Verification commands

| What | Command |
|---|---|
| Type check | `bunx tsc --noEmit` |
| Lint (incl. boundary) | `bun run lint` |
| Test | `bun run test` |
| Test (watch) | `bun run test:watch` |
| Dev server | `bun run dev` |
| Build | `bun run build` |
| E2E | `bun run e2e` |
| Static analysis | `bun run fallow:check` |
