# Flowstate — Product Overview

> **Source-of-truth tier.** This file establishes the product. The other five spec docs derive their decisions from this one. Read this first.

## 1. What Flowstate is

Flowstate is a personal cash flow management website with a long-term stock-investment simulator. It is built to satisfy a graded university assignment ("Using AI Software to Build a Cash Flow Management Website and Simulate Long-Term Stock Investment") while looking and behaving like a real, shippable IBM-product-grade tool.

A user enters their monthly income and expense items for the first five years of their plan. Flowstate computes the monthly net cash flow, splits a user-set 30–50% of that flow into a 5-stock portfolio, and projects forward to the 10-, 20-, and 30-year horizons under three deterministic growth scenarios (15%, 17.5%, 20% annualized). Charts and Tiles show the trajectory and the milestone values. Real ticker symbols come from a live financial data API; growth rates remain the assignment-mandated assumption.

## 2. Audience

| Audience | What they need from the product |
|---|---|
| **Primary user (in-fiction)** | An adult planning their first decade of cash flow and a 30-year investment outcome. They want to see "what happens if I keep doing this?" in concrete numbers. |
| **Stakeholder (real)** | The course instructor grading the assignment. They will read the report, watch the demo, and may ask the student to explain calculation logic and source code on the spot. |
| **You (the implementer)** | A solo student plus an AI implementation partner. Process must be legible: an `AI-PROCESS-LOG.md` is updated each session. |

## 3. Why this version exists (the pivot)

A V1 vanilla-HTML bento dashboard was built and retired. A subsequent "Flowstate" attempt under a hand-built monochrome design system was scaffolded and then abandoned before it shipped. The third and current attempt commits to **IBM Carbon Design System** as the entire design and component substrate. See [decisions/001_pivot-to-carbon.md](decisions/001_pivot-to-carbon.md) for the full Context → Decision → Consequences.

The implication of the pivot is that the previous design posture — monochrome, anti-AI, editorial-asymmetric, Fraunces/Outfit/JetBrains, hand-built primitives — is fully retired. Flowstate now looks and feels like an IBM Cloud product. That is intentional.

## 4. Design posture (Carbon-native)

Five non-negotiable postures shape every screen. Anything that contradicts them is a defect, not a style choice.

1. **Token before value.** Every color, spacing, type, motion, and breakpoint value is a Carbon token. No raw hex, no arbitrary px, no ad-hoc font sizes.
2. **Component before markup.** If Carbon ships it (`<Button>`, `<DataTable>`, `<Modal>`, `<NumberInput>`, `<Slider>`, `<Tile>`, `<SideNav>`, `<Tag>`, `<InlineNotification>` …), Flowstate uses it. No hand-rolled buttons, inputs, or modals.
3. **Theme over palette.** Code uses theme tokens (`text-primary`, `layer-01`, `support-error`) so the four Carbon themes (`white`, `g10`, `g90`, `g100`) all work for free. Default theme is **g90**; toggleable to `g100` and `white`.
4. **Grid for page; flex/grid for component.** Carbon's 2x Grid (`<Grid>` + `<Column>`) lays out every page. Native flex/grid stays inside individual components.
5. **Chromatic Carbon.** Status uses Carbon's full `support-*` tokens — `support-error` (red), `support-warning` (yellow), `support-success` (green), `support-info` (blue). The *previous* monochrome rule is dead. Color is one of Carbon's primary information channels and Flowstate uses it.

## 5. Stack at a glance

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)** | Carbon's reference docs assume Next; SSR + route handlers keep the Finnhub key off the client. |
| Runtime | **Bun** | Already established in this project; fast install + dev server. Node compatibility is fine for `@carbon/react`. |
| UI library | **`@carbon/react`** | Most full-featured Carbon flavor. PascalCase components. |
| Styling | **`@carbon/styles` (Sass)** + Carbon CSS custom properties | Theme via `<Theme theme="g90">` wrapper. `@use` over `@import`. |
| Charts | **`@carbon/charts-react`** for line/bar/donut/area; **D3** only when Carbon Charts cannot express the visual (e.g. a Sankey or a custom milestone overlay). | "Carbon Charts first, D3 when justified" — see [05_design_system_spec.md](05_design_system_spec.md) §8. |
| Type | **IBM Plex Sans / Plex Serif / Plex Mono** via Carbon's type styles | Loaded from CDN to avoid OFL self-host bookkeeping. |
| Icons | **`@carbon/icons-react`** | Pictograms via `@carbon/pictograms-react` for empty/error states. |
| Persistence | **LocalStorage** behind a `Repository` interface | Future swap to remote DB (WorkOS-backed) without rewriting features. |
| Validation | **Zod** | One schema validates form input and CSV imports. |
| Money | **Integer minor units + currency tag** | `{ amount: 50000000, currency: 'VND' }` = 50,000,000 đồng. Never floats. |
| Live tickers | **Finnhub** (free tier, 60 req/min) | Server-side via Next route handler; key in env. |
| FX | **`open.er-api.com` v6 latest** | Free, no key, daily-cached in LocalStorage. |
| Tests | **Vitest** for `src/lib/`, **Playwright** for critical user paths | Mirror of previous Phase 0 setup. |
| Lint | **ESLint** with a `no-restricted-imports` boundary on `src/lib/` (zero UI deps) | Same boundary rule as before; preserves pure-function discipline. |

## 6. Non-goals

Things Flowstate explicitly does **not** try to do:

- **No real money movement.** No bank linking, no Plaid, no transactions API.
- **No multi-user accounts in the MVP.** A future WorkOS swap is anticipated in the data-model design but not implemented.
- **No tax modeling.** Returns are gross; capital-gains tax, dividend tax, and inflation are mentioned as caveats in the report, not modeled.
- **No real stock-price prediction.** Live tickers exist for credibility (real symbols, last prices), not for the simulation. The simulation always uses the assignment-mandated 15/17.5/20% rates.
- **No social, sharing, or collaboration features.**
- **No mobile-app shell.** Flowstate is a responsive web app. Phone breakpoint is supported; phone-as-primary is not a design driver.
- **No analytics or tracking.** Out of scope for the assignment and for the trust posture.

## 7. Success criteria

Flowstate is "done" when all of the following are true:

### Assignment compliance (graded)

- [ ] User can enter income and expense items with name, amount, date, and notes.
- [ ] System computes total monthly inflow, outflow, and net cash flow.
- [ ] Monthly net flow displays both as a table and as a chart.
- [ ] User can set the investment ratio (slider, 30–50%, default 40%).
- [ ] Monthly investment splits equally across 5 user-selectable stocks.
- [ ] Three projection lines (15% / 17.5% / 20%) render across the 30-year horizon.
- [ ] 10-, 20-, and 30-year milestone values display in Tiles, per growth scenario.
- [ ] A growth chart shows the trajectory.
- [ ] Source code is commented and explainable.
- [ ] `AI-PROCESS-LOG.md` documents AI usage per session.
- [ ] Report (separate document) covers: AI tools used, how AI was used, main functions, net cash flow method, simulation method, screenshots.

### Production polish (self-imposed)

- [ ] Lighthouse accessibility ≥ 95 on every page.
- [ ] Keyboard-only operation completes the full flow (enter data → set ratio → pick stocks → view milestones).
- [ ] Theme switch (g90 ↔ g100 ↔ white) works without layout shift or color-leak bugs.
- [ ] Currency switch (VND ↔ USD) reflows numbers correctly using cached FX.
- [ ] Live ticker search returns results within ~600ms p50 on a warm cache.
- [ ] Carbon audit checklist (in `05_design_system_spec.md` §12) passes for every page.
- [ ] No raw hex codes, no ad-hoc px spacing, no hand-rolled Carbon-equivalent components in the codebase.

## 8. Glossary

- **Contribution phase.** Months 1–60 (years 1–5). User enters real income/expenses; net flow × ratio funds the portfolio.
- **Compounding phase.** Months 61–360 (years 6–30). No new contributions; portfolio compounds at the chosen growth rate.
- **Milestone.** A snapshot at month 120 (Yr10), 240 (Yr20), or 360 (Yr30). Three milestones × three growth rates = nine portfolio-value Tiles.
- **Growth scenario.** One of {15%, 17.5%, 20%} annualized. The user does not pick a single scenario; all three are shown simultaneously.
- **Net flow.** `inflow − outflow` for a given month. May be negative; if so, that month contributes 0 to the portfolio.
- **Investment ratio.** A 30–50% slider value. Applied only to non-negative net flow months.
- **Per-stock allocation.** `(net flow × ratio) ÷ 5`, since the brief mandates equal distribution across 5 tickers.
- **Display currency.** The currency the user is currently viewing in. Independent of the **stored currency** of any individual transaction.
- **Stored currency.** The currency a transaction was entered in. Persisted forever; never mutated by display switches.
