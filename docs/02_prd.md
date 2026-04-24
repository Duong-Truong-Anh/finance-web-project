# Flowstate — Product Requirements Document

**Document 2 of 3 · The PRD**
*Audience: product reviewer, engineering lead, implementation agent*
*Length target: 10+ pages*

---

## 1. Problem statement

Personal finance tools bifurcate into two categories, and neither serves the user who wants to reason about their long-term trajectory. The first category — bookkeeping apps like Mint, YNAB, Monarch — tracks the past with precision but treats the future as an afterthought. The second category — investment simulators like Portfolio Visualizer or retirement calculators — models the future in isolation from the user's actual monthly cash flow.

The user who wants to ask *"if I keep doing what I'm doing, where do I end up?"* has to operate both tools and mentally join them. This is friction that prevents the question from being asked often enough to matter.

**Flowstate is one tool that answers one question: given your current cash flow, what does your financial future look like if you invest a defined slice of what's left, and how does that future change when you change the inputs?**

The answer is delivered as a live, continuously-updating projection that reacts to every input change, with visualizations that emphasize flow (where money moves) over stock (what the balance is).

---

## 2. Users and use cases

### 2.1 Primary user: the self-directed planner

**Profile.** An adult in their 20s–40s with a stable-ish income, some disposable monthly cash, and no financial advisor. Financially literate enough to understand "net cash flow" and "annual return" without a glossary. Suspicious of apps that feel infantilizing. Uses spreadsheets occasionally but finds them brittle for long-term projection.

**Jobs.**
1. Log a month's income and expenses quickly and accurately.
2. See at a glance what their net monthly cash flow is and how it trends over time.
3. Decide how much of that net flow to allocate to investment, and see the 30-year consequence of that decision immediately.
4. Adjust the allocation ratio and see the projection update in real time.
5. Export their data when they want to leave the product or back it up.

### 2.2 Secondary user (future state): the power user

**Profile.** A self-directed investor who already tracks their finances somewhere but wants a better simulation tool. Expects keyboard shortcuts, custom stock selection via live APIs, Monte Carlo projections, and programmatic access via CSV.

**This user is not the MVP target.** They are called out here because the architecture must not box them out.

### 2.3 Explicit non-users

- People who want an AI financial advisor to recommend stocks. Flowstate does not make recommendations.
- People who want to link bank accounts. Flowstate is manual-entry and CSV.
- People who need to track multiple currencies in a single portfolio. Single-currency in MVP.
- Businesses with double-entry accounting needs. Flowstate is single-entity cash flow only.

---

## 3. Goals and non-goals

### 3.1 Goals (MVP)

1. Deliver the functional requirements of the academic assignment: income entry, expense entry, net cash flow calculation, 5-year investment ratio, 5-stock equal-weight portfolio, 15–20% annualized return, 10/20/30-year projection, statistical charts.
2. Deliver the four chart types called out in the design conversation: cash flow (Sankey + bar toggle), 30-year portfolio line, per-stock stacked area, contributions-vs-gains split.
3. Deliver the anti-AI design posture consistently across the product.
4. Deliver a keyboard-first interaction model with a Raycast-style command palette as a first-class input.
5. Deliver an architecture that can swap the storage layer (LocalStorage → Cloudflare D1 + WorkOS AuthKit) without a rewrite.

### 3.2 Non-goals (MVP)

1. Bank account linking, transaction sync, or Plaid integration.
2. Live stock price APIs. The MVP uses a parameterized return model.
3. Mobile-native apps. Responsive web only.
4. Multi-currency portfolios. Single user-selected currency.
5. Multi-user accounts. Single-user, browser-local.
6. AI-generated financial advice, recommendations, or commentary.
7. Tax modeling, capital gains calculation, or jurisdiction-specific logic.

### 3.3 High-ceiling items (explicitly deferred, architecturally preserved)

These are not MVP, but the architecture accommodates them:

- WorkOS AuthKit for authentication
- Cloudflare D1 + Drizzle ORM as the persistent data layer
- Live stock data via Yahoo Finance or similar free-tier API
- Monte Carlo simulation with 10th/50th/90th percentile bands
- User-defined stock selection (replacing the pre-selected 5)
- Import from bank CSV formats
- Multi-currency support with FX rate caching
- A chromatic color system (the monochrome MVP is deliberate; see section 7.2)
- Dark mode

### 3.4 Three-day MVP scope (academic deadline cut)

The assignment's stated timeline is one month, but this project is being delivered in **three working days**. The full MVP scope described in sections 5 and 7 remains the target; what follows is the tighter subset that must ship by the deadline. Anything not listed here is deferred to a post-submission iteration.

**Ships in 3 days:**

- Currency selection (first-load modal)
- Income and expense CRUD (add, edit, delete, recurring)
- Default category set (no user-created categories in the 3-day cut — users pick from the defaults; category management UI is deferred)
- Monthly transaction table
- Bar chart (monthly cash flow)
- Sankey diagram (monochrome, with tonal + pattern fills per section 7.2)
- Investment plan form (ratio slider, duration, expected-avg fallback)
- Projection engine (lognormal, seeded, deterministic)
- 30-year portfolio line chart
- Milestone readouts (10/20/30 years)
- One of: contributions-vs-gains chart **or** per-stock stacked area — whichever fits. Contributions-vs-gains is higher-priority because it makes the compounding insight visible; per-stock is decorative by comparison.
- Monochrome design system (typography, layout, spacing) per section 7
- LocalStorage persistence
- Responsive to tablet width; mobile graceful-degradation is acceptable
- README documenting the project for academic submission

**Explicitly deferred from the 3-day build (still in the full MVP spec):**

- Command palette and the broader keyboard-shortcut system
- CSV import and export
- Category creation/rename/delete UI
- Theme system (light-only is acceptable at 3 days since the MVP is monochrome already)
- Stock parameter override UI
- Simulation methodology panel (replaced by a short explanation in the README)
- Per-stock stacked area chart, if the contributions-vs-gains chart shipped first
- Demo data / sample dataset loader
- Milestone achievement confetti
- Full Playwright test suite (unit tests for the projection engine are still required)

The deferred features are all additive — none of them require structural changes to the code that ships in 3 days. The repository architecture, data model, and projection engine are built to their full-MVP shape. What's cut is UI surface, not architecture.

---

## 4. Product principles

These are load-bearing. Every feature decision must be justifiable against them.

**P1. Flow, not balance.** The product's primary mental model is money moving. Visualizations prefer Sankey, line, and area charts. Data models prefer transactions with source/destination over account snapshots.

**P2. Simulation is the main event.** The projection must update live on every input change, in under 50ms, on a mid-range laptop. No spinner is acceptable for a projection recompute.

**P3. Low floor, high ceiling.** Every feature must be usable without reading documentation. Every feature must also have a keyboard shortcut and a machine-readable representation.

**P4. No gradients. Anywhere. Ever.** This is a hard constraint. Color is flat. Emphasis is typographic, positional, or chromatic — never a gradient.

**P5. Typographic voice.** Numbers are set in a serif face (specifically: a humanist serif with old-style figures for body text and lining figures for tabular data — recommended faces in the design appendix). Labels, navigation, and chrome are set in a geometric sans. This contrast is the product's primary visual signature.

**P6. Editorial layout.** Symmetric centered layouts are forbidden for content-bearing views. The cash flow tab uses a sidebar+main split. The projection tab uses an asymmetric three-column grid. Dashboard cards have deliberate size variation.

**P7. Sourced empty and error states.** Every empty state cites the reason it's empty and the action that fills it. Every error states what was expected, what was received, and what to do.

**P8. Tactile feedback.** Primary buttons press. Input rejections shake. Milestones trigger confetti. Transitions have weight. (Timing values in the design appendix.)

**P9. Modularity by default.** Every feature is built behind a clean interface. The data layer, projection engine, chart layer, and auth layer are independently swappable.

---

## 5. Functional requirements

### 5.1 Income management

**5.1.1** Users can create, edit, and delete income entries.

**5.1.2** Each income entry has: a name (free text, required), an amount (positive number, required), a date (required, defaults to today), a category (optional, from a user-extensible list), and a notes field (free text, optional).

**5.1.3** Default income categories: Salary, Freelance, Business, Investment Returns, Gift, Other. Users can add, rename, and delete categories. Deleting a category with entries prompts for reassignment.

**5.1.4** Income entries are recurring-aware. A user can mark an entry as "monthly recurring" and the system treats it as recurring until marked otherwise. Recurring entries are projected forward in the cash flow table and backward-creatable from the command palette.

**5.1.5** Bulk entry: a user can paste a CSV snippet into a modal (or import a file) with columns matching the entry schema. Malformed rows are flagged with row-level errors; valid rows are accepted.

### 5.2 Expense management

**5.2.1** Same CRUD shape as income. Same fields. Same recurring logic.

**5.2.2** Default expense categories: Housing, Food, Transport, Utilities, Healthcare, Entertainment, Education, Savings (non-investment), Debt Payment, Other. Users can add, rename, delete.

**5.2.3** **The category set is load-bearing for the Sankey diagram.** Without categories, the Sankey collapses and loses its purpose. Onboarding must require the user to confirm or customize the category set before the Sankey view is accessible.

### 5.3 Net cash flow calculation

**5.3.1** For every month in which the user has any entry, the system computes:
- Total income (sum of all income entries in the month)
- Total expenses (sum of all expense entries in the month)
- Net cash flow (income − expenses)

**5.3.2** These values are displayed in a monthly table, one row per month, sortable by month and by net.

**5.3.3** Months with zero entries are not shown in the table by default, with a toggle to show them.

**5.3.4** The Sankey and bar chart visualizations both reflect the currently-selected month (the user picks from a month selector in the cash flow tab).

### 5.4 Investment ratio and allocation

**5.4.1** The user sets an investment ratio — a percentage of net cash flow to allocate to investment each month. The default is 40% (midpoint of the assignment's 30–50% range). The user can set any value from 0% to 100%.

**5.4.2** The assignment specifies a 5-year investment window as default. The user can extend or shorten this (1–30 years). After the window ends, contributions stop but the existing portfolio continues to compound. Both the ratio and window are exposed as a single "investment plan" form.

**5.4.3** Each month's investment amount is allocated equally among 5 stocks. In the MVP the 5 stocks are pre-selected (see 5.5.2). The user cannot change them in MVP; the architecture allows it in high-ceiling.

**5.4.4** If net cash flow for a month is negative or zero, the investment amount for that month is zero. The product does not simulate leveraged investing or deficit financing.

### 5.5 Portfolio simulation

**5.5.1 The return model.** Each stock has an **expected annual return (μ)** and an **annual return standard deviation (σ)**. Monthly returns are drawn from a lognormal distribution parameterized from these values. Why lognormal: equity returns are compounding and cannot drop below −100%, which normal distributions allow. Lognormal is the standard model in academic finance for exactly this reason.

Formula: at each month `t`, the return for stock `i` is drawn as:

```
r_i(t) = exp( (μ_i/12 − σ_i²/24) + (σ_i/√12) · Z ) − 1
```

where `Z` is a standard normal random variable. The term `σ_i²/24` is the Itô correction that keeps the expected compound return equal to μ.

**5.5.2 The 5 pre-selected stocks (MVP) with historically-grounded parameters.**

| Ticker | Name                   | μ (annual) | σ (annual) | Rationale                                                 |
| ------ | ---------------------- | ---------- | ---------- | --------------------------------------------------------- |
| FPT    | FPT Corporation (HOSE) | 18%        | 28%        | Vietnamese tech, high growth, high volatility             |
| VIC    | Vingroup (HOSE)        | 15%        | 35%        | Vietnamese conglomerate, moderate growth, high volatility |
| VOO    | Vanguard S&P 500 ETF   | 10%        | 15%        | US large-cap index, historical baseline                   |
| NVDA   | NVIDIA                 | 20%        | 45%        | US AI leader, high growth, very high volatility           |
| MSFT   | Microsoft              | 17%        | 25%        | US AI leader, high growth, moderate volatility            |

**Note on the assignment's 15–20% range.** The assignment specifies 15–20% average annual growth. The portfolio's equal-weighted expected return using the table above is (18+15+10+20+17)/5 = **16%**, which sits within the assignment's range. The σ values are derived from approximately 10 years of monthly return data for each instrument, rounded to defensible values. The user can override μ on a per-stock basis in a "simulation settings" panel (high-ceiling but cheap to include in MVP); σ is fixed in MVP.

**5.5.3 Determinism for the MVP.** The random draws are seeded. The same inputs produce the same projection every time the page loads. This is essential for the product to feel stable — a user who adjusts the ratio from 40% to 41% must see the projection change *because of the ratio change*, not because of new random numbers. The seed is derived from a hash of the user's input state. A "reroll" button generates a new seed on demand.

**5.5.4 Projection horizon.** The projection runs for 30 years. The system reports the portfolio value at three milestones: 10, 20, and 30 years. These are prominent in the UI; the underlying monthly trajectory drives the charts.

**5.5.5 Monte Carlo mode (high-ceiling, deferred).** The architecture supports running N simulations (e.g., 1000) and displaying 10th/50th/90th percentile bands instead of a single line. This is deferred to post-MVP but the projection engine must be designed as a pure function so this extension is a wrapper, not a rewrite.

### 5.6 Visualizations

Four charts, as agreed. Each is specified in detail in Document 3 (Feature Spec). Summary here:

**5.6.1 Monthly cash flow — Sankey (default) + bar chart (toggle).** The Sankey shows income sources → net cash flow hub → expense categories + investment allocation + leftover. The bar chart shows income and expenses as paired bars per month.

**5.6.2 30-year portfolio line.** A single line showing total portfolio value over 30 years, with labeled markers at 10/20/30 years. Contribution phase (years 1–5 by default) is visually distinguished from compound-only phase.

**5.6.3 Per-stock stacked area.** Five stacked areas, one per stock, showing each stock's contribution to total portfolio value over time.

**5.6.4 Contributions vs. gains.** A split area chart showing cumulative contributions as one band and cumulative investment gains as another. This is the compounding visualization — it makes the power of compounding visible in a way the other charts don't.

### 5.7 Command palette (Raycast-style)

**5.7.1** Invoked with ⌘K / Ctrl+K from anywhere.

**5.7.2** Supports: adding income, adding expense, jumping to any tab, changing the investment ratio, changing the currency, exporting CSV, importing CSV, toggling chart types, rerolling the simulation seed.

**5.7.3** Fuzzy search over all commands. Recent commands bubble up.

**5.7.4** This is not a nice-to-have. It is a first-class input method. A user should be able to complete an entire month's data entry without touching the mouse.

### 5.8 Import / Export

**5.8.1** Export: one-click download of a CSV containing all income entries, all expense entries, and the current simulation settings (as a separate sheet or leading metadata rows — see feature spec for exact schema).

**5.8.2** Import: file picker or paste-into-modal. Schema-validated. Row-level errors reported.

**5.8.3** The CSV format is documented and stable. It is the product's de facto data contract until the backend arrives.

### 5.9 Currency selection

**5.9.1** On first load, the user is prompted to pick a currency. Default selection inferred from browser locale but always confirmed.

**5.9.2** Supported currencies in MVP: VND, USD, EUR, GBP, JPY, SGD, AUD. (The decision to include VND explicitly reflects the user base implied by two Vietnamese stocks in the portfolio.)

**5.9.3** All monetary displays use the selected currency. No FX conversion; the user's data is all in one currency.

---

## 6. Architecture and stack

### 6.1 Stack recommendation with justification

**Frontend: Astro 5 + React islands + TypeScript + Tailwind (surgical use only).**

- **Why Astro over Next.js:** Astro's islands architecture means the Sankey and projection views are interactive React islands on otherwise-static pages. This keeps the site fast on Cloudflare Pages, ships minimal JS by default, and — critically for the anti-AI design posture — discourages the "everything is a Next.js page with 400kb of JS" pattern that produces generic-looking sites. Astro's multi-framework support also leaves room to drop in a Svelte or Solid island if a specific chart library fits better there.
- **Why React for islands:** the chart ecosystem (particularly D3 and Recharts) has the strongest React integration, and the team's hiring surface is broadest.
- **Why Tailwind surgically, not as primary styling:** Tailwind-by-default is one of the strongest AI-slop signals. We use Tailwind for layout utilities (flex, grid, spacing) but all component-level styling is in **CSS modules** with hand-written classes, custom properties for the design tokens, and real cascade usage. This is the single most important technical decision for the design posture. It is non-negotiable.
- **Why not shadcn/ui:** shadcn is excellent but its default aesthetic is the exact aesthetic we're rejecting. We take inspiration from its component patterns (headless logic, composition) but hand-build the visual layer.

**Charts: D3 for Sankey (unavoidable — the only good Sankey implementation) and for the projection line. Recharts for the stacked area and bar chart (sufficient quality, much faster to ship). Chart.js explicitly rejected as it produces identifiably generic output.**

**Projection engine: pure TypeScript, no dependencies, tested with Vitest. Lives in `/src/lib/projection/` as a self-contained module with a documented API. This is the product's computational core; it must not be coupled to the UI.**

**Data layer (MVP): LocalStorage behind a `Repository` interface.**

```typescript
interface TransactionRepository {
  list(filters?: TransactionFilters): Promise<Transaction[]>;
  create(input: NewTransaction): Promise<Transaction>;
  update(id: string, patch: TransactionPatch): Promise<Transaction>;
  delete(id: string): Promise<void>;
}
```

The MVP ships `LocalStorageTransactionRepository`. The production version will ship `D1TransactionRepository`. The UI depends only on the interface. This is the single most important architectural decision for long-term modularity.

**Data layer (production): Cloudflare D1 (SQLite at the edge) + Drizzle ORM.**

- D1 because the hosting is already on Cloudflare.
- Drizzle over Prisma because Drizzle's bundle size fits edge runtime constraints; Prisma doesn't, cleanly.
- The schema is defined once in Drizzle and the LocalStorage repo can be auto-generated from it (or at minimum, kept in sync via a type-derived contract).

**Auth (production): WorkOS AuthKit.** As specified by the user. Integration point is a single middleware layer on the Workers-based API routes. The UI depends on a `useUser()` hook that returns `null` in MVP and a real user object post-auth.

**Hosting: Cloudflare Pages for the static Astro build, Cloudflare Workers for the API routes (post-MVP), D1 for the database (post-MVP). CDN and edge caching come free.**

### 6.2 Module boundaries

```
/src
  /lib
    /projection         # pure TS. The projection engine. Zero UI deps.
    /transactions       # Repository interface + implementations
    /csv                # CSV parse/serialize. Pure.
    /simulation         # Return model, seeded RNG. Pure.
    /currency           # Formatting and locale. Pure.
  /features
    /cash-flow          # Cash flow tab. Imports from /lib.
    /projection         # Projection tab. Imports from /lib.
    /settings           # Settings pages. Imports from /lib.
    /command-palette    # Command palette. Cross-cutting.
  /components
    /primitives         # Hand-built Button, Input, etc. No shadcn.
    /charts             # Chart components. Wrap D3/Recharts.
    /typography         # Text components encoding the typographic voice.
  /styles
    /tokens.css         # Design tokens as CSS custom properties
    /global.css         # Global resets, typography base
```

The `/lib` layer has **zero dependencies on the UI layer**. The projection engine can be run in a Node script, a Worker, or a Web Worker without modification. This is enforced by an ESLint import boundary rule.

### 6.3 Performance budget

- Initial HTML + critical CSS: under 30kb gzipped (Astro static pages should not exceed this).
- JS per island: under 100kb gzipped for the largest island (projection tab with charts).
- Projection recompute on input change: under 50ms p95 on a 2020 MacBook Air.
- Sankey render: under 100ms for a typical month (< 30 transactions).
- Total time-to-interactive on cash flow tab: under 1.2s on 4G.

### 6.4 State management

- **Form state**: React Hook Form with Zod schemas. Zod schemas double as the CSV import validator.
- **Cross-feature state (current currency, investment plan, etc.)**: Zustand store with a persist middleware writing to LocalStorage behind the repository interface.
- **Server state (post-MVP)**: TanStack Query over the API routes.
- **Intentionally not using**: Redux, MobX, Jotai. The state graph is small enough that Zustand plus local React state suffices.

---

## 7. Design system

### 7.1 Typography

- **Display and body serif**: **Fraunces** (Google Fonts, free). A contemporary serif with optical-size and softness variable axes, genuine expressive range, and proper old-style and lining figure styles. Used for headlines, body copy, and all tabular figures in the transaction table, milestone readouts, and chart tooltips.
- **Sans**: **Outfit** (Google Fonts, free). A geometric sans with a clean, modern feel and a full weight range. Used for labels, buttons, navigation, and all UI chrome.
- **Mono**: **JetBrains Mono** (free). For keyboard shortcut chips, CSV previews, and any code-adjacent display.

**The rule.** Headlines and numerical content are Fraunces. Labels and interactive element text are Outfit. Code and shortcut chips are JetBrains Mono. A user who sees a number rendered in Outfit in this product is seeing a bug.

**Implementation specifics:**

- Load Fraunces with the `opsz` (optical size) and `SOFT` axes enabled. Use `opsz` at display sizes for the editorial feel; let it auto-size at body sizes.
- Fraunces's figure styles: use `font-variant-numeric: tabular-nums lining-nums` for transaction amounts and any tabular context. Use `oldstyle-nums` for inline body text mentions of numbers. The distinction is non-negotiable.
- Outfit at 14–16px for body UI, 12px for labels, 24–32px for section headers.
- All three fonts load via `<link>` with `display=swap` to prevent FOIT. Subset if possible to Latin + Vietnamese (the `vietnamese` subset of Fraunces and Outfit both exist on Google Fonts — use them; your user base includes Vietnamese speakers).

### 7.2 Color — the monochrome tonal system

The MVP ships with **zero chromatic color**. The entire product is a warm-black-on-warm-off-white monochrome. This is a deliberate constraint, not a cost-saving measure. Reasoning:

1. Color systems are genuinely hard — a badly chosen accent or a slightly-off positive/negative pair undermines the whole product. Removing color removes the most common failure mode.
2. The anti-AI design posture is expressed most clearly by rejecting the exact palettes AI defaults produce (purple-blue gradients, saturated greens and reds). Monochrome is the loudest possible rejection.
3. A well-executed monochrome product looks *more* distinctive than a mediocre colorful one. The product's identity will live in typography, layout, and spacing — which are the things AI is worst at imitating.

Chromatic color is a **post-MVP extension**, not a permanent ban. The tokens are structured so a color system can be added later without rewriting components.

**The palette (light mode, the only mode in MVP).**

All values are warm-biased — no pure grays, no cool casts. The palette has a slight paper/parchment feel that pairs with Fraunces.

| Token          | Hex       | Usage                                                                          |
| -------------- | --------- | ------------------------------------------------------------------------------ |
| `--canvas`     | `#F7F4EE` | Page background. Warm off-white. Never pure white.                             |
| `--paper`      | `#F0ECE4` | Secondary surface (sidebars, cards, subtle panels).                            |
| `--line`       | `#D9D3C6` | Dividers, borders, table rules, chart gridlines.                               |
| `--ink-subtle` | `#A19B92` | Tertiary text, disabled states, chart axis labels.                             |
| `--ink-muted`  | `#57524C` | Secondary text, labels, metadata.                                              |
| `--ink`        | `#1A1714` | Primary text and most interactive element fills.                               |
| `--ink-strong` | `#0A0806` | Emphasis: active states, primary button fills, the single reserved "hot" tone. |

Declare these as CSS custom properties in `/src/styles/tokens.css`. All components reference tokens, never hex values.

**Emphasis without color.** Where a conventional design system would use an accent color, Flowstate uses:

- **Typographic weight**: a 600-weight Outfit against 400-weight body copy is more arresting than a blue button in a sea of gray buttons.
- **Tonal contrast**: `--ink-strong` against `--canvas` is the product's maximum contrast. Reserve it for primary actions (save buttons) and the single most important number on any view.
- **Underline and rule**: active nav items are underlined; selected table rows have a 2px left border in `--ink`.
- **Fraunces italic**: the serif's italic style carries genuine voice. Use it for callouts and the "Gains exceed contributions" crossover label.

**Positive and negative values (income and expenses).**

No red/green. The distinction is typographic and glyphic:

- Income amounts: rendered in `--ink`, no prefix, Fraunces tabular lining figures.
- Expense amounts: rendered in `--ink`, prefixed with the typographic minus (`−`, U+2212, not hyphen), same Fraunces figures.
- Net cash flow, positive: `--ink-strong`, no prefix.
- Net cash flow, negative: `--ink-strong`, typographic minus prefix.
- Where additional emphasis is needed (e.g., a deficit warning), use Fraunces italic, not color.

This is how serious finance publications (Bloomberg print, the Financial Times) have always distinguished positive from negative. It works.

**Chart differentiation without color.**

This is the monochrome constraint's hardest problem. The Sankey must distinguish up to 12 categories; the per-stock stacked area must distinguish 5 stocks. Solutions:

1. **Tonal variation across a 5-step ink scale.** Each chart has its own local scale from `--ink-subtle` (20% visual weight) to `--ink-strong` (100%), spaced evenly.
2. **SVG pattern fills** for ties that tonal variation can't break. Five patterns are defined as reusable SVG `<defs>`: solid, diagonal stripe (45°), dots, horizontal stripe, crosshatch. Combined with tonal variation, this gives 25 distinguishable combinations — more than enough for 12 categories.
3. **Labeling as primary affordance.** In a monochrome chart, hover and labels do more work than color would. Every chart segment has an accessible label. Hover dims non-focused segments to 20% opacity — this is a more effective emphasis than color ever was.
4. **Stock-specific treatment** (5 stocks in the stacked area): assign each stock a fixed (tone, pattern) pair. Document the mapping in the chart component's README-style comment so the pattern is stable across the product.

**Dark mode**: deferred. A monochrome dark mode is easier to add than a full chromatic dark mode — it's effectively the same palette inverted with warmth preserved — so it stays on the roadmap, just post-MVP.

All tonal values above have been eyeballed for ≥4.5:1 contrast where needed (ink and ink-strong on canvas, ink-muted on canvas for secondary text). Verify with a contrast checker before shipping.

### 7.3 Layout

- **Cash flow tab**: sidebar (month picker, category filters) + main (Sankey, then transaction table below). 260px sidebar, fluid main.
- **Projection tab**: asymmetric three-column. Left: the investment plan form (narrow). Center: the projection chart (widest). Right: the milestone readouts (10y / 20y / 30y) stacked vertically. No centered-hero layouts.
- **Dashboard (landing)**: editorial grid with deliberate size variation. The month's net cash flow is the largest element; the 30-year projection hero is second; supplementary readouts are smaller.

### 7.4 Micro-interactions

- **Primary button press**: 100ms scale to 0.97, 200ms release. Spring curve, not ease.
- **Input rejection (invalid value)**: 3-cycle shake at 60ms per cycle, 4px amplitude.
- **Milestone achievement (e.g., first positive cash flow month saved, first projection run)**: confetti from the trigger element, 800ms duration, 40 particles. Confetti particles are small Fraunces glyphs (mix of asterisks, bullets, and the § pilcrow) in `--ink` and `--ink-strong`. No rainbow, no emoji, no color. The effect is celebratory but restrained — typographic debris, not a party.
- **Tab switch**: 180ms cross-fade with a 40ms position shift, not a slide.
- **Chart hover**: 80ms tooltip fade, with a 1px crosshair that snaps to data points.

The timing values above are **not suggestions**. They are specified because inconsistent micro-interaction timing is one of the tells of AI-generated UI.

### 7.5 Empty and error states

Template for empty states:

> **[State description with specific cause]**
> [What the system is doing in the absence of data]
> [The single action that fills the state, as a primary button]

Example (the cash flow tab when no entries exist for the selected month):

> **No transactions recorded for March 2026.**
> Net cash flow assumes zero until you add an entry. The Sankey and bar chart below will appear when you add your first entry this month.
> `[Add income]` `[Add expense]`

Template for error states:

> **[What was expected]**
> [What was received]
> [What to do]

Example (invalid investment ratio):

> **Investment ratio must be between 0% and 100%.**
> You entered 150%. The simulation cannot allocate more than 100% of net cash flow to investment.
> `[Reset to 40%]`

No "Oops! Something went wrong." No "Try again later." No cartoon illustrations.

---

## 8. Data model

### 8.1 Core entities

```typescript
type Currency = 'VND' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'SGD' | 'AUD';

type Transaction = {
  id: string;               // UUID v7 (timestamp-ordered)
  type: 'income' | 'expense';
  name: string;
  amount: number;           // stored as integer in smallest currency unit (VND đồng, US cents, etc.)
  date: string;             // ISO 8601 date, not datetime
  category: string;         // references CategoryDefinition.id
  notes?: string;
  recurring: boolean;
  recurringUntil?: string;  // ISO date, null = indefinite
  createdAt: string;
  updatedAt: string;
};

type CategoryDefinition = {
  id: string;
  kind: 'income' | 'expense';
  label: string;
  isDefault: boolean;       // true for the seeded default set
  displayOrder: number;
};

type InvestmentPlan = {
  ratio: number;            // 0..1, default 0.40
  durationYears: number;    // 1..30, default 5
  projectionHorizonYears: 30;  // fixed in MVP
  seed: string;             // for deterministic simulation
};

type StockDefinition = {
  ticker: string;
  name: string;
  mu: number;               // expected annual return
  sigma: number;            // annual return stdev
  isUserOverridden: boolean;
};

type UserSettings = {
  currency: Currency;
  theme: 'light' | 'dark' | 'system';
  investmentPlan: InvestmentPlan;
  stocks: StockDefinition[];  // exactly 5 in MVP
};
```

### 8.2 Storage schema (LocalStorage in MVP)

Keys:
- `flowstate:transactions` — array of Transaction
- `flowstate:categories` — array of CategoryDefinition
- `flowstate:settings` — UserSettings
- `flowstate:schema_version` — integer, for migration purposes

### 8.3 Schema migration strategy

A `migrations` module with numbered migration functions. On app load, the stored `schema_version` is read; any missing migrations are run in order; the version is updated. This is overkill for MVP but is the single most-regretted omission when a product needs to change its schema post-launch. Ship it day one.

---

## 9. Success metrics

### 9.1 Academic deliverable metrics

- All functional requirements from the assignment brief are implemented: **yes/no, binary**.
- The student can explain the projection math, the data model, and the architecture under questioning: **pass/fail, evaluated by instructor**.
- Charts render correctly across the three required milestones (10/20/30 years): **yes/no, binary**.

### 9.2 Design quality metrics (the screenshot test)

Three evaluators, unaware of the project's provenance, are shown screenshots of the projection view and the Sankey view. They are asked: "Does this look AI-generated?"

- **Target**: 0/3 say yes.
- **Acceptable**: 1/3 says yes.
- **Failure**: 2+/3 say yes.

This is subjective but it is the only metric that captures the design intent. It is explicitly surfaced here because it will otherwise be lost.

### 9.3 Performance metrics

- Projection recompute p95: under 50ms. Measured via a Playwright test that types into the ratio input and measures time-to-chart-update.
- Initial load (cash flow tab) TTI: under 1.2s on simulated 4G in Lighthouse.
- Accessibility: Lighthouse a11y score ≥ 95.

### 9.4 Product metrics (post-launch, post-MVP)

- Returning user rate (monthly): the product is designed for monthly use; a returning user rate above 30% at month 3 would indicate product-market fit.
- Session duration: **low is good**. A session should take 5–15 minutes. A long session indicates the user is fighting the interface.
- CSV export usage: the existence of exports is the product's trust signal. A non-zero export rate confirms users feel they own their data.

---

## 10. Risks and mitigations

| Risk                                                                                 | Likelihood | Impact    | Mitigation                                                                                                                                              |
| ------------------------------------------------------------------------------------ | ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The Sankey is too complex for users who don't know what a Sankey is                  | Medium     | High      | Always-available bar chart toggle; a first-time tooltip explains the chart                                                                              |
| The projection's variance makes users uncomfortable ("why does it change?")          | Medium     | Medium    | Deterministic seed by default; reroll button is an explicit action; copy explains what the variance represents                                          |
| The 5 hardcoded stocks feel arbitrary to non-Vietnamese users                        | Low        | Medium    | The high-ceiling path allows user-selected stocks; copy in the projection tab explains why these 5 were chosen                                          |
| LocalStorage data loss between devices                                               | High       | Low (MVP) | CSV export is prominent. Post-MVP this risk dissolves with the backend.                                                                                 |
| Design posture gets eroded during implementation by an AI agent defaulting to shadcn | High       | Very High | The design posture is documented exhaustively here. The implementation agent is given this PRD. Tailwind-only styling is forbidden at the ESLint level. |
| The keyboard-first command palette doesn't get used because users don't discover it  | Medium     | Low       | A persistent hint in the bottom-right corner: `⌘K to do anything`. This is a borrowed pattern from Linear and Raycast and it works.                     |

---

## 11. Open questions

The following are questions that cannot be answered from this document and will require a decision during implementation or before launch:

1. **Onboarding flow.** Do we require the user to confirm categories before first use, or do we let them start entering transactions and surface the category step lazily? Recommend: lazy. But this is a UX question that benefits from user testing.

2. **Demo data.** Should a new user see an empty canvas or a pre-populated demo dataset they can clear? A demo dataset makes the product immediately legible but risks the user thinking the numbers are theirs. Recommend: empty canvas, with a "Load sample data" command in the command palette.

3. **Dark mode.** Deferred from the 3-day MVP. Because the MVP is monochrome, adding dark mode post-launch is effectively a tonal inversion of the existing palette rather than a full second color system — much cheaper than a dark-mode retrofit on a chromatic product. Tokens should be structured from day one to make this a one-file swap: namespace the light-mode tokens under `[data-theme="light"]` even though only light exists today.

4. **Milestone years.** The assignment specifies 10/20/30. Some users may want to see intermediate milestones (e.g., 5, 15, 25). Recommend: the three are headline; the chart's tooltip shows any year on hover.

5. **Negative cash flow months in the projection.** When a user has a negative cash flow month, the investment amount is zero (per 5.4.4). But should the projection pause, or should the existing portfolio continue to compound? Recommend: the existing portfolio continues to compound — this is the realistic model. Call this out in copy.

6. **CSV re-import with existing data.** When a user imports a CSV, do we merge, replace, or prompt? Recommend: prompt, with both options available.

7. **What happens to investment contributions after the investment window ends?** Per 5.4.2, contributions stop. But the net cash flow continues to have a notional investment slice in the user's mental model. Do we redirect that slice to a "savings" line, or just flag it as unallocated? Recommend: flag as unallocated, with a followup prompt to extend the investment plan if it keeps accumulating.

8. **Locale-specific number formatting.** Vietnamese users expect dot-as-thousands-separator; American users expect comma. This should follow the currency selection, but needs explicit decisions per currency. Recommend: use the browser's `Intl.NumberFormat` with the user's selected currency locale as input; document the mapping.

---

## 12. Appendix: AI-collaboration note

Per the academic assignment, this project uses AI tooling in its implementation. This PRD, document 1, and document 3 are written by an AI acting as product/UX lead. The implementation is expected to use AI coding assistants.

**The student-facing expectation is that the student can defend every decision in this spec and every line of code in the resulting product.** This PRD is written to make that defense tractable: every feature cites its principle, every architecture decision cites its justification, every number is sourced. The student should read this document, the feature spec, and the narrative, and be able to answer the instructor's questions from memory — not because they memorized the documents, but because the documents explain *why*, and the "why" is what the instructor is actually asking about.