# Flowstate — Feature Specification

> Per-page behavioral spec. One section per page. Each section answers: what the page is for, the Carbon components it composes, the layout, the interactions, the empty/error states, and the keyboard/a11y notes.
>
> This is the workhorse spec — the one referenced in PR descriptions and in the AI-PROCESS-LOG when a feature is implemented.

## How to read this document

Each numbered section is a route. Sub-sections within a route are stable: **1. Goal · 2. Carbon composition · 3. Layout · 4. Interactions · 5. Empty / error states · 6. Keyboard & a11y · 7. Telemetry (always: none).**

When implementing a section, cite the section number in the PR description.

---

## 1. Onboarding (`/onboarding`)

### 1.1 Goal

Get a first-time user from "I just opened this" to "I have a portfolio configured and at least one transaction" in under 90 seconds. Auto-redirected to from `/` whenever transactions count = 0 AND the user has not chosen `Skip`.

### 1.2 Carbon composition

`<ProgressIndicator vertical>` on the left, content card (`<Tile>`) on the right. Three steps:

1. **Currency.** `<RadioButtonGroup>` choosing the *initial* `displayCurrency`. Sub-text explains stored currency vs display currency in plain language.
2. **Tickers.** Five `<ComboBox>` instances backed by `/api/tickers/search`. Each picks one symbol. A "Use sample portfolio" `<Button kind="ghost">` pre-fills five well-known tickers (AAPL, MSFT, GOOGL, AMZN, NVDA) for users who don't want to think about it.
3. **Ratio.** A `<Slider>` 30–50%, default 40%. Below the slider, a one-line live preview: "If your average net flow is 5,000,000 ₫, you'll invest 2,000,000 ₫ per month — 400,000 ₫ in each of your five stocks."

Bottom of the card: `<Button kind="primary">Continue</Button>` advances the step. `<Button kind="ghost">Skip & explore with demo data</Button>` is always present.

### 1.3 Layout

Onboarding does **not** render the SideNav. The `<Header>` is present but the SideNav slot is empty (this lets the user feel uninterrupted). `<Grid>` with two columns: `<Column lg={4}>` for the ProgressIndicator, `<Column lg={8}>` for the content Tile, on an `<lg={16}>` base. Centered horizontally with `<Column lg={{span: 12, offset: 2}}>`.

### 1.4 Interactions

- "Skip & explore" loads a deterministic demo dataset (12 months of plausible Vietnamese-context transactions: salary, rent, groceries, gas, savings) and pre-selects the sample tickers.
- Continue button is disabled until the step is valid: currency selected; five tickers picked or sample used; ratio in range.
- Back arrow on steps 2 and 3 returns to the previous step without losing entered values.
- On finish: `Settings` and `PortfolioConfig` are written; the user lands on `/`.

### 1.5 Empty / error states

- Finnhub search returns no results → `<ComboBox>` shows "No matches. Try another symbol or use the sample portfolio."
- Finnhub fails / rate-limited → `<InlineNotification kind="warning">` above the ticker step: "Live ticker search is unavailable. You can type a symbol manually and continue."

### 1.6 Keyboard & a11y

- `Enter` on a step's primary input advances.
- `Escape` triggers Skip with confirmation `<Modal>`.
- The ProgressIndicator items are not focusable; they are status, not navigation.

---

## 2. Dashboard (`/`)

### 2.1 Goal

A single-screen answer to "where am I?" — the at-a-glance condensed view. The user with five seconds gets the four numbers that matter (this month's net flow, total contributed, current portfolio value at mid-scenario, 30-year mid-scenario projection) and a sparkline of the trajectory. No data entry. No deep configuration. Click-throughs to `/cash-flow` and `/simulation` for anything more.

### 2.2 Carbon composition

Top row: four `<ClickableTile>` KPI tiles. Each tile is `<Column lg={4}>`.

| Tile | Headline number | Sub-line | Click destination |
|---|---|---|---|
| **This month** | Net flow (current month, in display currency) | "Inflow X − Outflow Y" | `/cash-flow` |
| **Contributed** | Total contributed across all entered months | "from N months entered" | `/cash-flow` |
| **Today's value (mid)** | Portfolio value at the current month, mid scenario (17.5%) | "low: X · high: Y" smaller | `/simulation` |
| **In 30 years (mid)** | Yr30 mid-scenario value | "low: X · high: Y" smaller | `/simulation` |

Below: a single Carbon Charts `<LineChart>` showing the three projection scenarios for the full 30-year horizon, condensed (no axis padding, smaller height ~280px). The `lg={16}` row.

Below the chart: a `<DataTable>` with the most recent 5 transactions. Header has a `<Button kind="ghost">View all →</Button>` linking to `/cash-flow`.

### 2.3 Layout

```
<Grid>
  <Column lg={16}><h1 className="cds--type-productive-heading-04">Dashboard</h1></Column>
  <Column lg={4}><Tile/></Column> × 4
  <Column lg={16}><LineChart/></Column>
  <Column lg={16}><DataTable size="sm" rows={5}/></Column>
</Grid>
```

At `md`: KPI tiles become 2x2 (`md={4}` each). At `sm`: stacked.

### 2.4 Interactions

- Hovering the line chart reveals Carbon Charts' default tooltip (month, value per scenario).
- Clicking a KPI tile routes to its destination.
- "View all" routes to `/cash-flow`.
- Theme switch in header re-themes the chart automatically (Carbon Charts honors Carbon themes natively).

### 2.5 Empty / error states

If transactions count = 0, the Dashboard renders a single empty-state `<Tile>` spanning `lg={16}`:

> **Pictogram: TaskAdd**
> **No data yet**
> Add your first income or expense to start projecting.
> `<Button kind="primary">Add a transaction</Button>` → routes to `/cash-flow?action=new`.

KPI tiles and chart are not rendered in the empty state.

### 2.6 Keyboard & a11y

- KPI tiles are `<ClickableTile>` so they are real links with focus rings and `Enter` activation.
- Chart has the auto-generated text alternative table.
- DataTable's row-level actions (Edit / Delete) are out of scope here — view-only on the Dashboard.

---

## 3. Cash Flow (`/cash-flow`)

### 3.1 Goal

The single combined view for income and expense management. The user adds transactions, sees the per-month roll-up, and reviews monthly net flow as a chart. This is the page where most data entry happens.

### 3.2 Carbon composition

A `<Tabs>` strip with three tabs:

| Tab | Filter |
|---|---|
| All | both kinds |
| Income | `kind = 'income'` |
| Expenses | `kind = 'expense'` |

Each tab body renders the same `<DataTable>` (different filter). Above the tabs, a top bar:

- `<Button kind="primary" renderIcon={Add}>Add transaction</Button>` — opens a `<ComposedModal>` with the entry form (see 3.4).
- `<Button kind="tertiary" renderIcon={Upload}>Import CSV</Button>`
- `<Button kind="ghost" renderIcon={Download}>Export CSV</Button>` — disabled when there are zero transactions.

~~Right side of the bar: a `<DateRangePicker>` filtering the month set~~ — **deferred to v1.1**. The chart already shows all months and the tabs filter by kind; date filtering is redundant for MVP.

Below the table: a Carbon Charts `<GroupedBarChart>` showing inflow / outflow per month, with a line overlay for net flow (this is a single chart with a secondary axis — Carbon Charts supports it via `<ComboChart>`).

### 3.3 Layout

```
<Grid>
  <Column lg={16}><Heading>Cash flow</Heading></Column>
  <Column lg={16}><TopBar/></Column>           // buttons + date range
  <Column lg={16}><Tabs/><DataTable/></Column>
  <Column lg={16}><ComboChart/></Column>
</Grid>
```

`<DataTable>` is `useStaticWidth` with sticky header. Columns: `Date · Kind · Name · Notes · Amount`. Amount column is right-aligned, tabular-nums. Kind column shows `<Tag>` badges (`type="green"` for income, `type="red"` for expense) — the Carbon palette tokens, not arbitrary hue.

Row actions (per-row `<OverflowMenu>`):

- Edit (re-opens the modal pre-filled)
- Delete (confirms via `<Modal>` per Carbon convention)

~~Duplicate~~ — **deferred to v1.1**. Add-transaction is fast enough that duplicate adds little MVP value.

Bulk actions (`<TableBatchActions>`): Delete selected. ~~Export selected~~ — **deferred to v1.1**; users can export-all then trim externally.

### 3.4 The "Add transaction" modal

`<ComposedModal>`:

- `<ModalHeader title="Add transaction" />`
- `<ModalBody>`:
  - `<RadioButtonGroup name="kind" legendText="Kind">` Income / Expense
  - `<TextInput labelText="Name" maxCount={80}/>`
  - `<NumberInput labelText="Amount" min={0} step={1}/>` + currency dropdown (`<Select>`) inline
  - `<DatePicker datePickerType="single" labelText="Date" />`
  - `<TextArea labelText="Notes" maxCount={400} optional/>`
- `<ModalFooter primaryButtonText="Save" secondaryButtonText="Cancel" />`

Validation uses the Zod schema; field-level `invalid` + `invalidText` props are bound. `Cmd/Ctrl + Enter` saves. `Esc` cancels (Carbon default).

### 3.5 Interactions

- Tabs filter the table only; the chart always shows all months.
- ~~Clicking a month bar in the chart filters the table to that month~~ — **deferred to v1.1**. Cross-component selection state adds non-trivial wiring for marginal value at MVP.
- CSV import opens a `<FileUploader>`; on parse, an interim modal shows a count of valid rows and a list of error rows in an `<InlineNotification kind="warning">`. The user confirms or cancels.
- Negative net flow months render the net-flow line in `support-error` red. (This is color *plus* the typographic minus glyph in the table — color is not the only channel.)
- Currency toggle in the header reflows both table amounts and chart axis labels.

### 3.6 Empty / error states

- No transactions → empty state pictogram + "Add your first transaction" CTA, like the Dashboard.
- CSV import errors → `<InlineNotification kind="error">` listing top 3 errors with a `<Link>` to expand the full list in a modal.
- Storage quota exceeded on save → `<ActionableNotification kind="error">` with action "Export & reset".

### 3.7 Keyboard & a11y

- `n` opens the Add modal (page-level shortcut, registered in `useKeyboardShortcuts`).
- DataTable is keyboard-navigable by Carbon defaults.
- Currency `<Select>` inside the modal has a clear label tied to the amount input via `aria-describedby`.

---

## 4. Simulation (`/simulation`)

> **Spec correction (post-Phase-1.W7 — teacher clarification 2026-05-10).** This section was authored against the old single-asset stocks-only model with a 30–50% slider. The teacher's clarification mandates a fixed five-asset allocation (stocks 50%, savings 10%, cash 10%, gold 10%, USD 10%); the slider is removed entirely. The page now displays the fixed allocation as read-only context, the five ticker pickers (still), the per-asset breakdown alongside the total, and milestone tiles for the total + a per-asset drill-down view. Sub-sections §4.2 / §4.3 / §4.4 below describe the **old** layout and stay as historical reference until Phase 3.2 ships the rewritten Simulation page; the **new** layout is described in `docs/03_calculation_spec.md` §3–§7 and will land in feature spec form alongside the Phase 3.2 implementation. Implementer agents working on Phase 3.x: trust the calculation spec over §4.2–§4.4 below.

### 4.1 Goal

Configure and visualize the 30-year projection. The user picks the five tickers (stock allocation is fixed at 50%) and reads the milestone outcomes for both the total portfolio and the per-asset breakdown. The page is dense by design — this is the assignment's centerpiece.

### 4.2 Carbon composition

Three regions, top to bottom.

**Region A — Configuration** (`<Column lg={16}>` wrapping a 2-column inner grid):

- Left: a `<Slider>` 30%–50%, step 1%, default 40%. Big readout above (`heading-04`) showing the live monthly investment value: "You're investing **2,200,000 ₫** every month."
- Right: a 5-card row (`<Tile>` × 5 in a `<Column lg={3}>` × 5 sub-grid, then `lg={1}` filler — actually `lg={3}` × 5 + `lg={1}`). Each tile shows: ticker symbol (large, mono), company name (truncated), live last price + change %, and a `<Button kind="ghost" renderIcon={Edit}>Change</Button>` opening a `<ComboBox>` modal.

**Region B — Projection chart** (`<Column lg={16}>`):

A Carbon Charts `<AreaChart>` with three series (15%, 17.5%, 20%) over 360 months. The 17.5% line is the visual anchor (heavier stroke). Hover surfaces all three values at once via Carbon Charts' built-in tooltip group.

Vertical reference lines at month 60 (end of contribution), 120, 240, 360 — using Carbon Charts' `thresholds` feature.

**Region C — Milestone Tiles** (`<Column lg={16}>`):

A 3-row × 3-column Tile grid. Rows = horizon (Yr10, Yr20, Yr30). Columns = scenario (Low 15%, Mid 17.5%, High 20%). Each Tile shows:

- Horizon label (small, `label-01`)
- Scenario badge (`<Tag size="sm">`)
- Portfolio value (large, `productive-heading-05`, tabular nums)
- Per-stock value (small, `body-compact-01`, prefixed "÷ 5: ")

Below the milestone grid: a `<StructuredList>` showing total contributed, total growth (dollar/đồng amount), and effective multiple ("3.4×") at the mid scenario.

### 4.3 Layout

```
<Grid>
  <Column lg={16}><Heading>Simulation</Heading></Column>

  <Column lg={6}><Tile><Slider/></Tile></Column>
  <Column lg={10}><div className="ticker-row"><Tile/> × 5</div></Column>

  <Column lg={16}><AreaChart height={420}/></Column>

  <Column lg={16}>
    <Grid condensed>
      <Column lg={5}><Tile/></Column> × 3 per row × 3 rows
    </Grid>
  </Column>

  <Column lg={16}><StructuredList/></Column>
</Grid>
```

### 4.4 Interactions

- Slider drags update the ratio in real time. Projection recomputes on every drag tick (50ms budget — tested).
- Ticker tile "Change" opens a `<ComboBox>` modal with Finnhub-backed search. Picking a new ticker updates the portfolio.
- Hovering a milestone Tile cross-highlights the corresponding point on the projection chart (a Carbon Charts custom interaction; if non-trivial, defer to v1.1 and document).
- Currency switch in the header reflows all numbers on this page; chart re-renders with the new currency formatter.

### 4.5 Empty / error states

- Fewer than 5 tickers picked → an `<InlineNotification kind="warning">` above the ticker row: "Pick X more ticker(s) to complete your portfolio. The projection still computes — the brief specifies equal allocation across 5."
- No transactions yet → a stronger `<InlineNotification kind="info">` linking to `/cash-flow`: "The projection assumes zero contribution until you add transactions."
- Finnhub fails on a price refresh → ticker tiles render symbol + name only, with a small "—" for price; a single banner `<InlineNotification>` reports the issue.

### 4.6 Keyboard & a11y

- Slider supports `Arrow Left/Right` (step 1%), `Page Up/Down` (step 5%), `Home/End` (min/max).
- Chart text alternative is auto-generated by Carbon Charts.
- Milestone Tiles have explicit `aria-label` reading "Year 10, mid scenario, 466 million đồng" for screen-reader users.
- Ticker tiles are not links; the "Change" button inside each is the focusable affordance.

---

## 5. Reports (`/reports`)

### 5.1 Goal

A staging page for the assignment deliverables: a clean view tuned for screenshot capture, a CSV export, a "demo dataset" toggle, and a one-page printable summary. The instructor opens this page during grading; the student opens it before the demo to capture screenshots.

### 5.2 Carbon composition

Top: a row of `<Tile>` cards titled "Deliverables checklist." Each card is one assignment requirement, with a `<Checkbox>` (visual checklist only — not persisted). Cards:

1. Income management — name, amount, date, notes
2. Expense management — name, amount, date, notes
3. Monthly net cash flow (table + chart)
4. Investment ratio (30–50%)
5. 5-stock equal allocation
6. Three growth scenarios (15 / 17.5 / 20%)
7. 10/20/30-year milestones
8. Statistical chart of growth

Each card links to the page that demonstrates it.

Below: a `<Tabs>` strip with three tabs.

- **One-page summary.** A printable page showing: currency display, portfolio config, milestone table (Yr10/Yr20/Yr30 × low/mid/high), 30-year chart, last-month cash flow row. CSS `@media print` strips the SideNav and Header. Carbon's `<PrintFriendly>` styling is honored.
- **Export.** Buttons for CSV export (transactions), CSV export (milestone snapshot), PNG export (current chart — uses Carbon Charts' built-in download).
- **Demo dataset.** A `<DataTableSkeleton>` while loading, then a preview of the 12-month deterministic demo dataset with `<Button kind="primary">Load demo</Button>` and `<Button kind="danger--ghost">Reset to empty</Button>`.

### 5.3 Layout

Standard. The print summary tab is a special layout — see 5.5 for print rules.

### 5.4 Interactions

- Loading the demo dataset asks for confirmation if existing transactions are present (`<Modal>`).
- Reset to empty asks for confirmation always.
- PNG export downloads the chart at 2x density.

### 5.5 Print rules

`@media print` rules in `globals.scss`:

```scss
@media print {
  .cds--header, .cds--side-nav { display: none; }
  .cds--content { padding: 0; }
  .flowstate-print-hidden { display: none; }
}
```

The print summary tab body has class `flowstate-print-target` and is the only thing visible on print. `<button>`s and interactive controls inside it are hidden.

### 5.6 Empty / error states

- Empty transactions + Reports page: the deliverables checklist still renders; the print summary is blank with "Add data to populate."

### 5.7 Keyboard & a11y

- Tabs are Carbon `<Tabs>`, fully keyboardable.
- Print summary uses real `<table>` semantics (not divs).

---

## 6. Settings (`/settings`)

### 6.1 Goal

The configuration drawer that doesn't fit in the header popovers. The user manages currency default, theme, Finnhub API key, FX cache, and the data reset.

### 6.2 Carbon composition

A vertical stack of `<FormGroup>` regions, each in its own `<Tile>`:

1. **Display currency.** `<RadioButtonGroup>` VND / USD. Persisted to `Settings.displayCurrency`.
2. **Theme.** `<RadioButtonGroup>` g90 (default) / g100 / white. Persisted; applied via the root `<Theme>` wrapper.
3. **Finnhub API key.** `<TextInput type="password" labelText="Finnhub key" helperText="Stored in your browser's LocalStorage. We never send it to our servers because we don't have any.">`. A `<Button kind="tertiary">Test connection</Button>` calls `/api/tickers/search?q=AAPL` and shows result.
4. **FX rates.** Read-only display of the current snapshot (USD→VND rate, fetched-at timestamp). `<Button kind="tertiary">Refresh now</Button>` forces a refresh. Toggle: `<Toggle labelText="Refresh automatically once a day" />`.
5. **Data.** Three buttons:
   - `<Button kind="tertiary">Export all data (CSV bundle)</Button>`
   - `<Button kind="tertiary">Import a CSV bundle</Button>`
   - `<Button kind="danger">Reset all data</Button>` — opens a `<Modal>` requiring the user to type "RESET" to confirm (Carbon `dangerHeader` modal pattern).

### 6.3 Layout

`<Column lg={{span: 8, offset: 4}}>` (centered, content-width). Form groups stack vertically with `mb={spacing-07}` spacing between Tiles.

### 6.4 Interactions

- Each setting persists immediately on change (no "Save" button at the bottom — Carbon prefers per-field saves for settings of this granularity).
- "Test connection" surfaces a `<ToastNotification>` on success/failure.
- Reset is irreversible. The confirmation modal explains this and offers an "Export first" link.

### 6.5 Empty / error states

- Finnhub key empty → "Test connection" button is disabled, helper text reads "Add your key to enable live ticker search."
- FX never fetched → "Refresh now" is the only enabled control under FX rates.

### 6.6 Keyboard & a11y

- Form is a single `<form>` with `aria-labelledby` to the page heading.
- The reset confirmation modal traps focus per Carbon `<Modal>` defaults.

---

## 7. Live ticker integration — cross-cutting

### 7.1 Architecture

```
Client                    Next.js                Finnhub
  │  GET /api/tickers/      │                      │
  │     search?q=AAPL  ───▶ │  GET /search?q=AAPL  │
  │                         │  ◀──── results ──── │
  │  ◀── results (cached) ──│                      │
```

The Finnhub key never reaches the client. The Next.js route handler reads `process.env.FINNHUB_API_KEY` if set; if not, it falls back to the user-supplied key from the request header `X-Flowstate-Finnhub-Key`. The client adds that header from `Settings.finnhubKey`.

### 7.2 Caching

- Search results cached in memory on the server for 60s per query.
- Quote results cached in memory for 30s per symbol.
- `Cache-Control: private, max-age=30` on quote responses.

### 7.3 Failure modes

| Scenario | Server response | UI behavior |
|---|---|---|
| No key configured | 412 + `{ error: 'no_key' }` | UI prompts user to add key in Settings. |
| Key invalid | 401 + `{ error: 'invalid_key' }` | UI shows error toast + link to Settings. |
| Rate-limited | 429 + retry-after | UI silently waits + retries once; then surfaces. |
| Finnhub down | 502 + `{ error: 'upstream' }` | UI shows last cached values; degrades gracefully. |

### 7.4 What the live data is used for

- Onboarding step 2 (ticker picker)
- Settings → Test connection
- Simulation page → ticker tiles (last price + % change)

It is **never** used to compute the projection. The projection always uses the assignment-mandated growth rates.

---

## 8. FX integration — cross-cutting

### 8.1 Architecture

`open.er-api.com/v6/latest/USD` is called server-side once per UTC day. The response is cached in LocalStorage as `FxRateSnapshot`. All `convert()` calls thread this snapshot.

### 8.2 First-run

On first app boot with no cached snapshot, a non-blocking `<Loading>` spinner appears in the header for the duration of the fetch (typically < 400ms). Pages render with VND-only entry until it lands; conversion is deferred.

### 8.3 Failure modes

If the fetch fails and no cache exists, a banner `<InlineNotification kind="warning">` reads "Display currency conversion is unavailable. Amounts show in their stored currency until rates load." The user can still operate the app fully.
