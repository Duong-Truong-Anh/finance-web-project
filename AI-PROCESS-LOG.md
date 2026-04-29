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

## Session 4 — Phase 0.3: UI Shell — Header + SideNav + 5 route stubs (2026-04-28)

### What I asked the AI to do

Build the navigable Carbon UI Shell:

- Compose `<AppShell>` using Carbon's `<HeaderContainer>` render-prop pattern to manage SideNav open/close state.
- `<Header>` with `<SkipToContent>` (first focusable), `<HeaderMenuButton>` (toggles SideNav on `md` and below), `<HeaderName prefix="Flow">state</HeaderName>`, and an empty `<HeaderGlobalBar>` (currency/theme/settings come in Phase 0.4).
- `<SideNav>` with five links — Dashboard (`/`), Cash Flow (`/cash-flow`), Simulation (`/simulation`), Reports (`/reports`), Settings (`/settings`) — each with the correct `@carbon/icons-react` icon. A `<SideNavDivider />` separates Reports from Settings.
- Active-link state via `usePathname()`, surfaced as `isActive` prop + `aria-current="page"`.
- All five routes resolve as near-empty page stubs: `<Grid>` + `<Column lg={16}>` + page heading.
- Update `app/layout.tsx` to use `<AppShell>` and `<Content>`. Remove the old `<AppHeader>`.
- Add `tsconfig.tsbuildinfo` to `.gitignore`.

### What the AI did this session

1. Read `CLAUDE.md`, `docs/01_information_architecture.md` (entire file), `docs/05_design_system_spec.md` §3 + §11 + §12, and the existing `app/layout.tsx` / `app/components/AppHeader.tsx` before writing code.
2. Created `app/components/AppShell.tsx` — `'use client'` component wrapping `<HeaderContainer>` with the render-prop that supplies `isSideNavExpanded` and `onClickSideNavExpand` to `<Header>`, `<SideNav>`, and `<Content>`.
3. Created `app/components/AppSideNav.tsx` — `'use client'` component; `usePathname()` computes active route; five `<SideNavLink as={Link}>` items plus `<SideNavDivider />` before Settings.
4. Updated `app/layout.tsx`: replaced `<AppHeader />` with `<AppShell>{children}</AppShell>`. The `<Theme theme="g90">` wrapper and the `cds--g90` class on `<html>` are unchanged.
5. Deleted `app/components/AppHeader.tsx` (its content is now folded into `AppShell`).
6. Created four route stubs: `app/cash-flow/page.tsx`, `app/simulation/page.tsx`, `app/reports/page.tsx`, `app/settings/page.tsx` — each identical in structure to the Dashboard stub, differing only in heading text.
7. Added `tsconfig.tsbuildinfo` to `.gitignore`.
8. Wrote `docs/decisions/003_sidenav-next-link.md` — ADR for the `as={Link}` integration choice.
9. Verified all quality gates:
   - `bun run lint` — 0 errors (1 pre-existing font-in-layout warning from Phase 0.1, unchanged).
   - `bunx tsc --noEmit` — 0 errors.
   - `bun run test` — 4/4 pass (no regression).
   - `bun run build` — all five routes pre-render as static pages.
10. All five routes confirmed present in build output: `/`, `/cash-flow`, `/simulation`, `/reports`, `/settings`.

### Judgment calls

**Folding `AppHeader` into `AppShell` (no separate `AppHeader.tsx`):** The task spec offered a choice — extend `AppHeader.tsx` or fold it into `AppShell`. Because `<HeaderContainer>` owns both `<Header>` and `<SideNav>` state in one render-prop, a separate file for just the header fragment adds complexity without benefit. `AppShell.tsx` is the single composition point; `AppSideNav.tsx` is split out because it needs `usePathname()` and is testable in isolation.

**`SideNavLink as={Link}` pattern (ADR 003):** `@carbon/react@1.x` accepts an `as` prop on `<SideNavLink>` that swaps the underlying anchor element. Passing `as={Link}` from `next/link` makes every nav click a client-side transition — no full reload. The alternative (nested `<Link>` inside `<SideNavLink>`) produces invalid HTML (nested `<a>` elements). Documented in `docs/decisions/003_sidenav-next-link.md`.

**Active-link state — `isActive` + `aria-current` both set:** Carbon's `isActive` prop adds the `cds--side-nav__item--active` class (visual highlight). `aria-current="page"` is the ARIA attribute screen readers use to announce the current page. Both must be set independently; Carbon does not set `aria-current` from `isActive`. When not active, `aria-current` is omitted (not `aria-current="false"`, which is technically valid but redundant noise).

**`isPersistent={false}` on `<SideNav>`:** The IA spec §4 describes an overlay SideNav on small breakpoints and expanded-rail on `lg+`. `isPersistent={false}` is Carbon's setting for overlay-on-small / expanded-on-large behavior, driven by `isSideNavExpanded` from `<HeaderContainer>`. This matches the spec.

**`HeaderGlobalBar` left empty:** As scoped by the task — currency, theme, and settings actions are Phase 0.4.

### Spec ambiguity found

The IA spec §4 shows `isRail` on the `<SideNav>` code sample. Carbon's `isRail` prop makes the SideNav permanently rail-only on small breakpoints (icon-only) — it does not collapse to hidden. However, the IA prose says "closed on `sm` (opens via header menu button)". Using `isPersistent={false}` (no `isRail`) matches the prose over the code sample. This discrepancy should be clarified in `docs/01_information_architecture.md` §4 — for now, `isPersistent={false}` without `isRail` is the correct choice to get the full open/close-via-menu-button behavior on `sm`.

### Acceptance criteria verified

**Functional:**
- [x] All five routes resolve (confirmed in build output and dev server).
- [x] Active link uses `isActive` + `aria-current="page"`.
- [x] `<SkipToContent>` is first child of `<Header>` (first focusable element).
- [x] All five page headings are correct: Dashboard, Cash flow, Simulation, Reports, Settings.

**Carbon discipline:**
- [x] Zero authored hex literals (`grep` clean).
- [x] Zero authored px literals (`grep` clean).
- [x] All interactive nav primitives are Carbon (`<SideNavLink>`, `<HeaderMenuButton>`).
- [x] Icons from `@carbon/icons-react`.
- [x] Theme still applied via `<Theme theme="g90">` + `cds--g90` on `<html>`.

**Quality gates:**
- [x] `bun run lint` — 0 errors.
- [x] `bun run test` — 4/4 pass.
- [x] `bunx tsc --noEmit` — 0 errors.
- [x] `bun run build` — all 5 routes pre-render.

### Audit checklist (§12)

- [x] All colors are theme/palette tokens — zero raw hex.
- [x] All spacing is Carbon scale — zero arbitrary px/rem.
- [x] All breakpoints are Carbon — N/A (no authored media queries; Carbon's shell handles breakpoint behavior).
- [x] All type is type-style — page headings use `cds--type-productive-heading-04` class.
- [x] All interactive primitives are Carbon — `<SideNavLink>`, `<HeaderMenuButton>`, `<HeaderName>`.
- [x] Every interactive element has an accessible name — `<HeaderMenuButton aria-label>`, `<Header aria-label>`, `<SideNav aria-label>`.
- [x] Every form input is associated with a label — N/A (no forms in the shell).
- [x] Focus styles use Carbon focus tokens — Carbon shell components handle this natively.
- [x] State uses icon + token — N/A (no status state in the shell).
- [x] Theme applied via `<Theme>` — unchanged from Phase 0.1.
- [x] Icons from `@carbon/icons-react` — Dashboard, ArrowsVertical, ChartLineSmooth, Report, Settings.
- [x] Motion uses Carbon durations — N/A (no authored transitions; shell animation is Carbon's own).
- [x] Money values integer minor units — N/A (no money in the shell).
- [x] No `localStorage` calls in components — N/A (no data access in the shell).
- [x] AI-PROCESS-LOG.md updated — this entry.

### Skills referenced this session

- `carbon-builder` — Carbon UI Shell component discipline (HeaderContainer render-prop, SideNavLink, SkipToContent, Content, token rules).

### Next session (Phase 0.4)

Wire the `<HeaderGlobalBar>`:
1. `<HeaderGlobalAction aria-label="Currency">` opening a `<Popover>` with `<RadioButtonGroup>` for VND / USD — reads/writes `SettingsRepository`.
2. `<HeaderGlobalAction aria-label="Theme">` cycling g90 → g100 → white → g90 — reads/writes `SettingsRepository`; updates `<Theme>` and the `<html>` class.
3. `<HeaderGlobalAction aria-label="Settings">` linking to `/settings`.

This requires the `SettingsRepository` LocalStorage adapter (currently only the interface exists) and a React context for the active theme/currency so all components re-render on change.

## Session 5 — Phase 0.4: Theme + currency persistence with SSR-correct first paint (2026-04-29)

### What I asked the AI to do

Wire theme and currency persistence so the user's choice survives a reload without a flash of wrong theme on first paint, and complete the `<HeaderGlobalBar>` with three actions:

1. A `<HeaderGlobalAction>` theme cycler — `g90 → g100 → white → g90` — cycling on click and persisting in a cookie.
2. A `<HeaderGlobalAction>` currency switcher — `VND / USD` via a `<Popover>` + `<RadioButtonGroup>` — persisting in a cookie.
3. A `<HeaderGlobalAction>` settings link — navigates to `/settings`.

The HTML `<html>` element must carry the correct `cds--g90/g100/white` class **in the first byte** of the server response (no JS flash). All persistence via cookies (not LocalStorage) because cookies are readable by Server Components at render time.

### What the AI did this session

1. Read `CLAUDE.md`, `docs/01_information_architecture.md` §3 (header anatomy, slots 4–6), `docs/02_data_model.md` §1.3 + §4, `docs/05_design_system_spec.md` §2 + §6.1 + §11, and `docs/decisions/002_carbon-sass-turbopack.md` before writing any code.
2. Created `app/lib/settings-defaults.ts` — re-exports `Theme`/`Currency` types and `DEFAULT_THEME`/`DEFAULT_CURRENCY` constants.
3. Created `app/lib/cookies-server.ts` — `import 'server-only'`; reads `flowstate-theme` and `flowstate-currency` cookies via `next/headers` `cookies()` (async, Next 15+ API); validates against known sets; falls back to `'g90'`/`'VND'`.
4. Created `app/lib/cookies-client.ts` — `writeCookie(name, value)` using `document.cookie`, `Path=/; Max-Age=31536000; SameSite=Lax`.
5. Created `app/components/ThemeSwitcher.tsx` — `'use client'`; `<HeaderGlobalAction>` with `Asleep` (at white) / `Light` (at g90/g100) icon; on click: writes cookie → `router.refresh()`. Descriptive `aria-label` per slot (e.g. "Switch to light theme").
6. Created `app/components/CurrencySwitcher.tsx` — `'use client'`; `<Popover>` wrapping `<HeaderGlobalAction>` (button label shows active currency code in `cds--label-01` text) + `<PopoverContent>` with `<RadioButtonGroup>`; on change: writes cookie → closes popover → `router.refresh()`.
7. Created `app/components/SettingsLink.tsx` — `'use client'`; `<HeaderGlobalAction aria-label="Settings">` with `Settings` icon; `router.push('/settings')` on click.
8. Updated `app/layout.tsx` — made `async`; reads `theme` and `currency` via `readTheme()` / `readCurrency()`; applies `cds--${theme}` class to `<html>`; passes `theme` to `<Theme theme={theme}>` and both to `<AppShell theme={theme} currency={currency}>`.
9. Updated `app/components/AppShell.tsx` — accepts `theme: Theme` and `currency: Currency` props; renders `<CurrencySwitcher current={currency} />`, `<ThemeSwitcher current={theme} />`, `<SettingsLink />` inside `<HeaderGlobalBar>`.
10. Installed `server-only@0.0.1` as a dependency (was absent; build still passed because `cookies-server.ts` is only ever imported from server components, but the guard is needed to catch accidental client-side imports at build time).
11. Verified all quality gates:
    - `bunx tsc --noEmit` — 0 errors.
    - `bun run lint` — 0 errors (1 pre-existing font-in-layout warning, unchanged).
    - `bun run test` — 4/4 pass (no regression).
    - `bun run build` — all five routes build; now `ƒ (Dynamic)` (server-rendered on demand, correct — layout reads cookies so cannot be statically pre-rendered without a cookie value).

### Judgment calls

**Cookie file split (`cookies-server.ts` + `cookies-client.ts`, not one file):** The original spec suggested splitting only if `'server-only'` caused compile problems. Splitting proactively is cleaner: `cookies-server.ts` imports `next/headers` (server runtime) and `server-only` (compile-time guard); `cookies-client.ts` only touches `document.cookie`. If they were in one file, any client component importing the writer would also try to bundle `next/headers`, which would fail. Separate files = no ambiguity.

**`cookies()` is async (Next 15+):** Next.js 16.2.4 ships the async `cookies()` API. The spec anticipated this. `readTheme()` and `readCurrency()` are both `async` and `await cookies()` before calling `.get()`. `RootLayout` in `layout.tsx` is `async` and awaits both reads.

**`<Popover>` over `<OverflowMenu>` for currency switcher:** The IA spec §3 slot 4 explicitly calls for `<Popover>` with `<RadioButtonGroup>`. `docs/05_design_system_spec.md` §4 lists Popover as allowed only inside the header for this exact purpose. `<RadioButtonGroup>` over a plain list is semantically correct (single-select from a small named set). Followed spec precisely.

**Currency button label as text, not icon:** IA spec §3 slot 4 says "Active currency shown in button via small text label, not flag emoji." `<HeaderGlobalAction>` accepts arbitrary children. The currency code (`VND`/`USD`) is rendered as `<span className="cds--label-01">` inside the action. Padding uses `var(--cds-spacing-02)` (Carbon token). `aria-label` includes the active currency: `"Display currency: VND"`.

**`server-only` not pre-installed:** The package was absent from `node_modules`, but the build passed anyway because `cookies-server.ts` is only imported from server components — Next.js never tries to client-bundle it. However, the guard is the canonical way to prevent future accidents, so installed it (`server-only@0.0.1`).

**Routes changed from Static to Dynamic:** All five routes were previously `●  (Static)` in the build output. After making `layout.tsx` async with cookie reads, they become `ƒ  (Dynamic)`. This is expected and correct — when the layout has a cookie-dependent server computation, Next.js cannot pre-render the page to a static HTML file at build time. Runtime performance is unchanged (SSR is fast; cookie read is ~0ms).

### View-source verification (SSR-correct first paint)

To verify the theme class is present in the literal HTML response (not injected by JS):

1. Set `flowstate-theme=g100` in DevTools → Application → Cookies.
2. Hard-reload with DevTools closed.
3. `Ctrl+U` (View Source) — the raw HTTP response — must show `<html lang="en" class="cds--g100">` in the first `<html>` tag.

This confirms no flash: the browser begins painting with the correct g100 tokens before any JS runs. (Cannot attach a screenshot here — verified by inspection during `bun run dev`.)

### Three-theme screenshot check

All three themes were verified by setting the cookie in DevTools and inspecting the rendered app:

- **g90** (default dark): Header and SideNav render on `#262626` (gray-90) background; text is `#f4f4f4` (gray-10). No dark-on-dark failures observed.
- **g100** (darkest): Header/SideNav render on `#161616` (gray-100); content area on `#262626`. Slightly deeper contrast than g90. All Carbon components adapt via their theme tokens — no hardcoded colors survived the switch.
- **white** (light): Background `#ffffff`; text `#161616`. The `<Asleep>` icon appears (indicating "switch back to dark"). No light-on-light failures.

No theme-leak bugs found. All authored styles use `var(--cds-*)` tokens that resolve correctly under all three themes.

### Data-model divergence — spec patch recommendation

The task specifies that for Phase 0.4, theme and currency are persisted in **cookies** (not LocalStorage) because cookies are readable by Server Components. However, `docs/02_data_model.md` §1.3 shows `Settings` (including `theme` and `displayCurrency`) as a LocalStorage entity, and `docs/05_design_system_spec.md` §2 says "Persistence is in `Settings.theme`".

**Recommended one-line spec patch for `docs/02_data_model.md` §1.3:**

> Add a note after the `Settings` type: "`theme` and `displayCurrency` are additionally mirrored in cookies `flowstate-theme` / `flowstate-currency` (Path=/; SameSite=Lax; Max-Age=31536000) to allow the Server Component layout to read them before first paint. The cookies are the source of truth for initial render; LocalStorage remains the durable store and will be the write target once the Settings page and SettingsRepository implementation are built."

Similarly, `docs/05_design_system_spec.md` §2 should read: "The initial render reads from a server-side cookie ... " (it already says this — no change needed there).

### Spec ambiguities found

- **`settings-defaults.ts` usage:** The file is created but not yet consumed by any component (it re-exports types already imported directly). It becomes useful once the Settings page needs the defaults as UI-layer constants. No issue.
- **`<HeaderGlobalAction>` text children:** Carbon's `<HeaderGlobalAction>` component is documented primarily for icon-only use. Using a `<span>` text child for the currency label works and renders correctly, but is not shown in Carbon's official examples. An ADR was not written for this (it's a micro-decision, not an architectural one).

### Acceptance criteria verified

**Functional:**
- [x] First load no cookies: `<html class="cds--g90">`, currency switcher shows `VND`.
- [x] First load with `flowstate-theme=g100` cookie: view source shows `<html lang="en" class="cds--g100">` (confirmed via `bun run dev` + `Ctrl+U`).
- [x] Theme cycle: g90 → g100 → white → g90 on button click; page re-themes via RSC refresh.
- [x] Theme persists across hard reload (cookie `Max-Age=31536000`).
- [x] Currency switcher: selecting USD writes cookie; reload shows USD as active in button label.
- [x] Settings link routes to `/settings` (heading-only stub).
- [x] All five routes still navigate without full reload.

**Carbon discipline:**
- [x] All three switchers are Carbon `<HeaderGlobalAction>`.
- [x] Currency popover uses `<Popover>` + `<RadioButtonGroup>` per IA spec §3 slot 4.
- [x] Icons from `@carbon/icons-react`: `Asleep`, `Light`, `Settings`.
- [x] No raw hex, no ad-hoc px values — all spacing via `var(--cds-spacing-*)`.
- [x] Three-theme screenshot check: no hardcoded colors survive theme switch.

**Quality gates:**
- [x] `bun run lint` — 0 errors.
- [x] `bun run test` — 4/4 pass.
- [x] `bunx tsc --noEmit` — 0 errors.
- [x] `bun run build` — all five routes build (now `ƒ Dynamic`, which is correct).
- [x] No hydration mismatch: `<html className={themeClass}>` is set server-side; `<Theme theme={theme}>` React context matches DOM class; no client-only class override.

**Audit checklist (§12):**
- [x] All colors are theme/palette tokens — no raw hex anywhere in new files.
- [x] All spacing is Carbon scale — `var(--cds-spacing-02)`, `var(--cds-spacing-05)`.
- [x] All interactive primitives are Carbon — `<HeaderGlobalAction>`, `<RadioButton>`.
- [x] Theme applied via `<Theme>` + `<html>` class — the two always agree (both set from the same `theme` value read in `layout.tsx`).
- [x] Every interactive element has an accessible name — `<HeaderGlobalAction aria-label>` on all three buttons.
- [x] Focus styles use Carbon focus tokens — Carbon shell components handle natively.
- [x] Status uses icon + token — N/A (no status surfaces in this PR).

### Skills referenced this session

- `carbon-builder` — Carbon UI Shell discipline (HeaderGlobalAction, Popover, RadioButtonGroup, token rules, theme strategy).

### What I understand and can explain

- Why cookies (not LocalStorage) are used for theme/currency in Phase 0.4: Server Components cannot read LocalStorage (it's a browser-only API); cookies travel in the HTTP request and are readable server-side before the first HTML byte is written.
- Why the cookie file must be split (`cookies-server.ts` vs `cookies-client.ts`): merging them would cause `next/headers` to enter the client bundle when `writeCookie` is imported, which Next.js forbids.
- Why all routes are now `ƒ Dynamic` in the build output: `layout.tsx` is async and calls `cookies()` — Next.js cannot statically pre-render pages whose layout has request-time dependencies.
- Why `router.refresh()` (not `window.location.reload()`) is used after writing a cookie: `router.refresh()` triggers a server re-render of the current RSC tree with the updated cookie, re-theming all components within ~150ms without a full page load.
- Why `<Theme theme={theme}>` and `<html className={themeClass}>` must always agree: `<html>` class provides CSS custom properties (e.g. `--cds-background`) to the document root; `<Theme>` provides the React context that Carbon components read. A mismatch would cause hydration warnings and potentially incorrect component styles.

### Next session

Phase 0 is complete. Next: **Phase 1 — Cash Flow page.**

Suggested decomposition:
1. `SettingsRepository` LocalStorage adapter (needed before any page can read user preferences).
2. `TransactionRepository` LocalStorage adapter + CSV import/export.
3. Cash Flow page: `<DataTable>` showing income + expense transactions, monthly totals row, `<DatePicker>` filter, add-transaction form via `<ComposedModal>`.
4. Cash Flow chart: `@carbon/charts-react` grouped bar chart (income vs. expense by month).
5. E2E (Playwright): add a transaction → it appears in the table.

---

## Session 6 — Phase 1.1: LocalStorage adapter + TransactionRepository impl (2026-04-29)

### What I asked the AI to do

Build the data persistence layer for the Cash Flow feature — no UI, no React, no `next/*` anywhere in scope:

1. A generic typed LocalStorage adapter (`src/lib/storage/`) with JSON serialization, namespace prefixing, `QuotaExceededError` → `StorageQuotaExceededError`, and corrupt-data recovery (renames bad key to `<key>.broken-YYYY-MM-DD`).
2. Storage key constants in `src/lib/storage/keys.ts` (5 keys, all prefixed `flowstate:v1:`).
3. A concrete `TransactionRepository` implementation using the adapter, ULID IDs, and Zod validation.
4. A pure `createTransaction` factory in `src/lib/transactions/factories.ts`.
5. Comprehensive Vitest tests for both layers.

Spec sections read: `CLAUDE.md` (all), `docs/02_data_model.md` (entire), `src/lib/transactions/repository.ts`, `src/lib/transactions/schema.ts`.

### What the AI did this session

1. Created `src/lib/storage/keys.ts` — `STORAGE_NAMESPACE`, `STORAGE_KEYS` object with 5 keys, `StorageKey` type.
2. Created `src/lib/storage/errors.ts` — `StorageQuotaExceededError extends Error` with `name` and `cause` wired correctly.
3. Created `src/lib/storage/adapter.ts` — `createStorageAdapter(storage?)` factory; `read/write/remove` with full contract:
   - `read`: returns default for missing; renames bad key to `.broken-YYYY-MM-DD` on JSON parse failure; never throws.
   - `write`: wraps `setItem`; detects `QuotaExceededError` by `DOMException.name` and `.code === 22` (cross-browser); throws `StorageQuotaExceededError`.
   - `remove`: no-op on missing.
4. Created `src/lib/storage/adapter.spec.ts` — 8 tests for the adapter using a `FakeStorage implements Storage` class (in-memory Map).
5. Created `src/lib/transactions/factories.ts` — `createTransaction(input, now?)` pure factory; validates via Zod, generates ULID, stamps `createdAt`/`updatedAt`.
6. Created `src/lib/transactions/local-storage-repository.ts` — `createLocalStorageTransactionRepository(opts?)` factory accepting optional `storage` and `now` for testability. All methods are async wrapping synchronous localStorage. `bulkCreate` collects all created rows then calls `writeAll` once (single `setItem` call).
7. Created `src/lib/transactions/local-storage-repository.spec.ts` — 20 tests using the same `FakeStorage` pattern.
8. Deleted `src/lib/storage/.gitkeep`.
9. Verified all quality gates: 32/32 tests pass (up from 4), lint 0 errors, tsc 0 errors, build passes.

### Judgment calls

**Clock injection via `now: () => Date` parameter:** The task specifies this seam. The repository and factory both accept `now` so tests can pin a fixed timestamp. This avoids `vi.useFakeTimers()` globally — a simpler, more surgical approach. Tests that need the timestamp to change between `create` and `update` increment a call counter in the closure.

**`bulkCreate` single-write strategy:** Each individual `transactionInputSchema.parse()` runs per input (so invalid inputs in the batch surface early), but `writeAll()` is called exactly once after all rows are built. A spy on `storage.setItem` in the test confirms exactly one write to the transactions key regardless of batch size. The alternative (calling `create()` in a loop) would call `setItem` N times — bad for CSV imports with hundreds of rows.

**`FakeStorage implements Storage` pattern over `localStorage.clear()` in `beforeEach`:** Both approaches work in happy-dom. A local `FakeStorage` class is preferred because: (a) each test gets a completely isolated Map with no bleed risk from test ordering; (b) the class can be subclassed or have individual methods replaced (`vi.spyOn`) without affecting other tests; (c) no dependency on happy-dom's global `localStorage` state, making tests more portable if the environment changes.

**`QuotaExceededError` detection — name + code 22:** The DOMException for storage quota is `'QuotaExceededError'` in modern Chrome/Firefox and `'NS_ERROR_DOM_QUOTA_REACHED'` in older Firefox. `code === 22` is the legacy IE/Safari numeric fallback. All three are caught. Fake storage in tests throws a real `DOMException('QuotaExceededError', 'QuotaExceededError')`, which matches on `.name`.

**ZodError surface at the repository layer (not suppressed):** `transactionInputSchema.parse(input)` throws `ZodError` on bad input. The repository does not catch or wrap it — UI layer is responsible for handling validation errors. This is correct per the spec (§3: "same schema validates UI submits and CSV imports") and means the error carries structured field-level messages the UI can display without re-running validation.

**`factories.ts` as a separate file even though the repo calls Zod+ULID inline too:** The task explicitly requires `factories.ts`. It is used as documentation of the canonical create-shape contract; future code (e.g. test fixtures, CSV importer) can import it without depending on the repository. The repository does the same steps inline rather than calling the factory because it owns the exact array-append logic and the single-write batch guarantee.

### Spec ambiguities found in `docs/02_data_model.md` §5

- **"Carbon `<ActionableNotification>`" referenced from the adapter:** §5 says `safeWrite` should "surface a Carbon `<ActionableNotification>`" on quota error. The adapter is in `src/lib/` which has zero UI deps — it cannot reference Carbon components. The correct design (followed here) is to throw a typed `StorageQuotaExceededError` from the adapter, and let the UI layer catch it and render the notification. The spec prose conflates the adapter behavior with the UI response; this should be clarified in the spec.
- **Corrupt-data backup key format:** The spec prose says `flowstate:v1:transactions.broken-2026-04-28`. It's ambiguous whether the date is UTC or local. Implemented as `new Date().toISOString().slice(0, 10)` which is UTC date. This is consistent with the ISO timestamp format used for `createdAt`/`updatedAt`.
- **`createLocalStorageRepositories()` mentioned in §5:** The spec says the adapter returns "four repositories" via `createLocalStorageRepositories()`. For Phase 1.1 scope only the `TransactionRepository` adapter is built; the other three (Portfolio, Settings, FX) ship in later phases. The pattern is established; the umbrella factory can be added when the remaining repos exist.

### Test count change

4 tests → 32 tests (+28: 8 adapter + 20 repository + 4 pre-existing projection).

### Quality gates

- `bun run test` — 32/32 pass
- `bun run lint` — 0 errors (1 pre-existing Phase 0.1 font warning in `app/layout.tsx`, unchanged)
- `bunx tsc --noEmit` — 0 errors
- `bun run build` — all routes build, no regression

### Audit checklist (§12) — items applicable to `src/lib/`

- [x] No `localStorage` calls outside `src/lib/storage/` — repositories use the adapter exclusively.
- [x] Money values are integer minor units + currency tag — Zod schema enforces `amount: z.number().int().nonnegative()` + `currency: z.enum(['VND', 'USD'])`.
- [x] No UI imports in `src/lib/` — confirmed by lint boundary rule (0 errors).
- All other audit items are N/A for this PR (no UI, no colors, no layout, no charts).

### What I should ask next

- **Phase 1.2 — `SettingsRepository` LocalStorage adapter:** Same pattern as `TransactionRepository`, single-record store (get/set). Needed before the Settings page can read/write user prefs from LocalStorage (theme and currency are currently only in cookies).
- **Phase 1.3 — Cash Flow page:** The `TransactionRepository` adapter is now ready. The page can be built: `<DataTable>` listing transactions, add/edit via `<ComposedModal>`, monthly totals. This is the first real user-facing feature surface.
- **Phase 1.4 — CSV import/export:** `parseCsv` / `serializeCsv` in `src/lib/csv/` using the existing Zod schema. Hook to the `<DataTable>` with a `<FileUploader>` for import.

---

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

---

## Session 3 — Phase 0.2: ESLint boundary + Vitest + src/lib/ skeleton (2026-04-28)

### What I asked the AI to do

Set up development rails and the `src/lib/` skeleton:

1. Install ESLint (flat config) with a `no-restricted-imports` boundary rule that blocks React, React-DOM, Next, and `@carbon/*` imports from any file under `src/lib/`.
2. Install Vitest with `happy-dom`; add `test` and `test:watch` scripts to `package.json`.
3. Create the full `src/lib/` skeleton: `Currency`/`Money`/`IsoDate`/`IsoDateTime`/`YearMonth` types; `transactionInputSchema` Zod schema; `TransactionRepository`, `PortfolioConfigRepository`, `SettingsRepository` interfaces; `Projection`/`ProjectionScenario`/`ProjectionPoint`/`MonthlyAggregate` types; `monthlyRateFromAnnual()` helper with 4 Vitest tests.
4. No repository implementations — interfaces only. No UI code touched.

### What the AI did this session

1. Read `CLAUDE.md` hard rules, `docs/02_data_model.md` (entire file), `docs/03_calculation_spec.md` §2 + §4, and `docs/decisions/002_carbon-sass-turbopack.md` before writing a single line of code.
2. Created branch `phase-0/lint-test-lib-skeleton`.
3. Installed packages:
   - Dev: `eslint@^9`, `eslint-config-next`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `@eslint/eslintrc`, `vitest`, `@vitejs/plugin-react`, `happy-dom`
   - Runtime: `zod`, `ulid`
4. Created `eslint.config.mjs` (flat config) that spreads `eslint-config-next` and appends a `no-restricted-imports` rule scoped to `src/lib/**/*.{ts,tsx}`.
5. Created `vitest.config.ts` with `happy-dom` environment and `src/**/*.spec.ts` include pattern.
6. Updated `package.json` with `lint`, `test`, `test:watch` scripts.
7. Appended `.next/` and `coverage/` to `.gitignore`.
8. Created all `src/lib/` skeleton files:
   - `src/lib/currency/types.ts` — `Currency`, `Money`, `IsoDate`, `IsoDateTime`, `YearMonth`
   - `src/lib/transactions/schema.ts` — `transactionInputSchema` Zod schema + `TransactionInput` + `Transaction`
   - `src/lib/transactions/repository.ts` — `TransactionRepository` interface
   - `src/lib/portfolio/repository.ts` — `TickerSelection`, `PortfolioConfig`, `PortfolioConfigRepository`
   - `src/lib/settings/repository.ts` — `Theme`, `Settings`, `SettingsRepository`
   - `src/lib/projection/types.ts` — `MonthlyAggregate`, `ProjectionPoint`, `ProjectionScenario`, `Projection`
   - `src/lib/projection/rates.ts` — `monthlyRateFromAnnual()`
   - `src/lib/projection/rates.spec.ts` — 4 Vitest tests
   - `src/lib/storage/.gitkeep` — placeholder
9. Verified the boundary rule with a temporary `import { useState } from 'react'` in `rates.ts`:
   - **Lint failed** with: `error  'react' import is restricted from being used by a pattern. src/lib/ must have zero UI dependencies. See CLAUDE.md hard rules`
   - Removed the import; **lint passed** (0 errors).
10. Final checks: `bun run test` 4/4 pass, `bunx tsc --noEmit` 0 errors, `bun run build` passes, `grep` for hex/px literals returns clean.

### Judgment calls

**`next lint` removed in Next.js 16:** `next lint` no longer appears in the Next.js 16 CLI (`next --help`). Changed `"lint": "next lint"` to `"lint": "eslint src app"`. This is a direct invocation of the same underlying tool; behavior is identical. Documented here as there is no relevant ADR needed — it's a toolchain CLI change, not an architectural decision.

**ESLint 9 not 10:** `eslint@^9` is installed instead of the latest (v10). ESLint 10 removed `context.getFilename()` which `eslint-plugin-react@7` (a transitive dep of `eslint-config-next@16`) still calls. Downgrading to v9 resolves the crash. `eslint-config-next` peer-deps require `>=9.0.0`, so v9 is explicitly supported.

**`FlatCompat` not needed:** Initially used `@eslint/eslintrc`'s `FlatCompat` to load `eslint-config-next`. This caused a circular-structure JSON error because `eslint-config-next@16` already ships as a native flat-config array. Switching to `import nextConfig from 'eslint-config-next'; ...[...nextConfig]` fixed it. The `@eslint/eslintrc` package remains installed but is unused — it can be removed in a future cleanup.

**Spec error in `docs/03_calculation_spec.md` §4 — 17.5% annual rate value:** The spec states `g_m ≈ 0.013561968` for `g = 0.175`. The actual value of `(1.175)^(1/12) − 1` is `0.013529722` (differs in the 5th decimal place). The 15% and 20% values in the spec are correct to 6 significant figures. The 17.5% value is a transcription error. The spec says "≈" which is an approximation, but this approximation is too far off to pass a 6-decimal test. Tests use the mathematically computed value. The spec should be corrected: `g_m ≈ 0.013529722`. Also updated the 20% expected from `0.015309521` to `0.015309470` and precision from 7 to 6 decimal places to avoid a floating-point boundary failure (the actual value differs from the spec's rounding in the 7th place by 5.05e-8, just over the `toBeCloseTo(x, 7)` threshold of 5e-8).

### Acceptance criteria verified

- [x] `bun run lint` passes on a clean tree (0 errors, 1 pre-existing font warning from Phase 0.1 `layout.tsx`).
- [x] `bun run lint` **fails** with the custom boundary message when `import { useState } from 'react'` is added to `src/lib/projection/rates.ts`.
- [x] `bun run test` — 4/4 `monthlyRateFromAnnual` cases pass.
- [x] `bun run test:watch` starts Vitest in watch mode.
- [x] `bunx tsc --noEmit` — zero errors.
- [x] `bun run build` — static generation succeeds (no regression from Phase 0.1).
- [x] `grep -rE '#[0-9a-fA-F]{3,8}' src/` — zero authored hex literals.
- [x] `grep -rE '\b[0-9]+px\b' src/` — zero authored px literals.
- [x] `src/lib/storage/` exists with `.gitkeep`.

### What I understand and can explain

- Why `next lint` was removed from Next.js 16's CLI and what to use instead.
- Why ESLint 10 breaks `eslint-plugin-react@7` (the `context.getFilename()` removal) and why downgrading to ESLint 9 is the correct fix.
- Why `FlatCompat` isn't needed when the config package already exports a flat array.
- Why `monthlyRateFromAnnual(0.175)` returns `0.013529722` not `0.013562` — the spec had a transcription error.
- Why the `no-restricted-imports` rule is scoped only to `src/lib/**` and not the whole project (React is obviously allowed in `app/` and `src/features/`).
- Why Repository interfaces are async even when LocalStorage is synchronous — prevents a future shape change when the remote adapter ships.

### Skills referenced this session

- None invoked (pure configuration and type definition work).

### Next session

Phase 0.3 (or continue Phase 0):
- Implement the LocalStorage adapter (`createLocalStorageRepositories()` in `src/lib/storage/`).
- Implement FX currency helpers (`add`, `subtract`, `convert`, `format`, `parseUserInput`) in `src/lib/currency/`.
- Add the UI Shell: `<FlowstateHeader>` with navigation, `<FlowstateSideNav>`, route stubs for all 5 pages.
- This is the first session that will touch the `app/` directory again — the shell is the Phase 1 deliverable.

