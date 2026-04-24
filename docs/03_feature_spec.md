# Flowstate — Jobs-to-be-Done & Feature Specification

**Document 3 of 3 · The Feature Spec**
*Audience: implementation engineer (human or AI agent)*
*Length target: 10+ pages*

---

## How to read this document

Each feature is framed as a **Job** the user is trying to get done, followed by the **Feature Specification** that delivers that job. The Job frame answers "why does this feature exist?"; the Spec frame answers "how exactly does it behave?"

Every spec section follows the same sub-structure:

- **Surface** — where in the product this lives
- **Behavior** — the exhaustive rules of how it works
- **Edge cases** — what happens when things are weird
- **Acceptance** — how we know it's done right

If you are an implementation agent, treat this document as the source of truth for feature behavior. Defer to the PRD (Document 2) for architecture and to the Narrative (Document 1) for design posture.

---

## Job 1: "I want to record what came in this month, fast."

A user who has just been paid, or just finished freelance work, wants to record the inflow without a ceremony. They know what it's for, they know how much it is, and they want the app out of their way as quickly as possible.

### Feature 1.1: Add income entry

**Surface.** Available from three places: the primary "Add income" button on the cash flow tab sidebar, the command palette (⌘K → "add income" or just "income"), and a keyboard shortcut (I) when no input is focused.

**Behavior.**

1. Invoking the add flow opens a modal (not a full-page route) with fields in this tab order: Name → Amount → Date → Category → Notes → Recurring toggle → [Save] [Save and add another] [Cancel].
2. **Name**: free text, required, max 80 characters. Autofocus on open.
3. **Amount**: number input, required, must be positive. Displayed with the user's currency symbol as a static prefix. Accepts both `1234.56` and `1,234.56` and `1.234,56` (locale-aware parse). Stored as integer cents.
4. **Date**: date picker, required, defaults to today. Accepts typed input in the local date format.
5. **Category**: dropdown, required, defaulted to the most recently used income category for this user (if any), otherwise "Salary". Dropdown contains all income categories plus a `+ New category` affordance at the bottom.
6. **Notes**: textarea, optional, max 500 characters.
7. **Recurring**: toggle, default off. When on, reveals a "Recurring until" date picker with an "Indefinite" option (the default).
8. **Save** closes the modal and the transaction appears at the top of the transaction list with a 600ms highlight fade. If the user's current month view changes (e.g., the entry was for a different month), the month selector updates to show the affected month.
9. **Save and add another** persists the entry and resets the form, keeping the Category and Date fields populated for rapid sequential entry.
10. **Cancel** with an unsaved dirty form prompts: "Discard this entry?" Yes/No. Cancel on a clean form just closes.
11. Escape key cancels. Enter on any field submits (unless focus is in the notes textarea, where Enter is a newline and ⌘+Enter submits).

**Edge cases.**

- **Zero amount entered**: the Save button is disabled with the hint "Amount must be greater than zero."
- **Negative amount entered**: the input visibly shakes (per the rejection micro-interaction spec); the hint reads "Income must be a positive number. Did you mean to record an expense instead?" with a button `[Switch to expense]` that converts the current form to an expense entry with the same fields.
- **Date in the future**: allowed without warning. Users legitimately log upcoming recurring income.
- **Date more than 50 years in the past or future**: soft warning, not a block.
- **Very large amount** (above 10^12 in smallest currency unit): soft warning, not a block.
- **Paste containing a currency symbol or comma**: parsed and normalized.

**Acceptance.**

- A user with no prior transactions can save their first income entry in under 15 seconds from clicking "Add income."
- Keyboard-only completion of the form is possible and tested in Playwright.
- The command palette path (⌘K → income) produces an identical modal.
- Recurring entries appear in future months automatically when the cash flow table is viewed for those months.

### Feature 1.2: Edit income entry

**Surface.** Click any row in the transaction table. Also via command palette (⌘K → "edit last income").

**Behavior.** Same modal as 1.1, pre-populated, with Save replaced by `Update` and `Save and add another` replaced by a `Delete` action (destructive, requires confirmation).

**Edge cases.**

- Editing a recurring entry: a prompt asks "Edit this occurrence only, or all future occurrences?" with the latter as the default for consistency with Google Calendar's pattern.

**Acceptance.**

- A user can correct a typo in an amount in under 10 seconds.
- Deletion requires explicit confirmation and is undoable via a toast with an Undo button for 8 seconds after.

---

## Job 2: "I want to record what went out this month, without feeling judged."

A user logging an expense — especially a guilt-adjacent one like dining out or entertainment — should not be made to feel bad. Neutral UI, no color-coding that implies judgment, no "you've exceeded your budget" warnings unless the user explicitly asked for a budget feature.

### Feature 2.1: Add expense entry

**Surface.** Primary button on cash flow tab, ⌘K → "add expense", shortcut `E`.

**Behavior.** Structurally identical to Feature 1.1, with these differences:

1. Default category is the most recently used expense category, otherwise "Food."
2. The amount input's currency symbol is displayed identically to the income form — since the MVP is monochrome, there is no red/green differentiation anywhere. The distinction between income and expense is carried by the form's title, the category, and eventually by the typographic minus glyph (`−`) prefix on expense amounts in the transaction table.
3. No "Did you mean to record an income?" flip; negative amounts are simply rejected with "Expenses must be positive numbers. Enter the amount you spent."

**Edge cases.**

- **Expense in a month where income has not been recorded**: no warning. The user is logging reality, not answering the product's questions.
- **Expense amount greater than the month's total income**: no warning. See the principle above.

**Acceptance.**

- The expense form is visually identical to the income form except for the category default and the form title. This symmetry is load-bearing.
- No copy, color, or behavior in the expense flow implies judgment about the expense.

---

## Job 3: "I want to see, at a glance, where my money went this month."

This is the headline job the Sankey diagram exists to serve.

### Feature 3.1: Monthly Sankey diagram

**Surface.** Cash flow tab, main panel, top half. Default visualization for the selected month.

**Behavior.**

1. The Sankey has three columns of nodes:
   - **Left (sources)**: one node per income category with non-zero income in the selected month. Labeled with the category name and the total amount.
   - **Center (hub)**: a single node labeled "Net Cash Flow" with the month's total income as its inflow width and its outflows split among destinations.
   - **Right (destinations)**: one node per expense category with non-zero spending, plus a node for "Investment" (the investment ratio applied to net cash flow), plus a node for "Unallocated" (whatever is left over).
2. Flow widths are proportional to amount, scaled to the visible area.
3. **Flow styling (monochrome).** Each income category and each expense category is assigned a `(tone, pattern)` pair from the chart design tokens. Tones are 5 levels from `--ink-subtle` to `--ink-strong`; patterns are 5 SVG-defined fills (solid, diagonal-stripe, dots, horizontal-stripe, crosshatch). The 25 combinations cover up to 25 distinguishable categories. Flows retain their source category's `(tone, pattern)` through the hub node. On the right side, flows are rendered at 60% opacity of the source tone, allowing overlapping flows to visually merge at the destination. The specific category-to-(tone, pattern) mapping is stored as a lookup table in the chart component and is stable across the product — a category's visual treatment in the Sankey matches its treatment in the transaction table filter chips and any other categorized view.
4. Hovering any flow highlights it (100% opacity) and dims other flows (30% opacity). A tooltip shows: source category → destination category → amount → % of total income.
5. Clicking a node filters the transaction table below to only transactions in that category. Clicking again clears.
6. The Sankey is drawn with D3's `sankey` layout module.
7. **Negative net cash flow case**: if expenses exceed income, the Sankey is drawn with a distinct "Deficit" node on the right that visualizes the shortfall. The Investment node is zero-width (not shown). Copy: "This month ran a deficit. The investment plan pauses for months with negative cash flow."

**Edge cases.**

- **No transactions in month**: Sankey is replaced by the empty state (see below).
- **Only income, no expenses**: Sankey shows all flow going to Investment and Unallocated.
- **Only expenses, no income**: Sankey is not drawn. Copy: "This month has recorded expenses but no income. Add an income entry, or continue browsing expenses in the table below."
- **Single-category income and single-category expense**: Sankey degenerates to effectively two flows, which is visually boring but not broken. Still draw it.

**Acceptance.**

- The Sankey renders in under 100ms for a typical month (< 30 transactions).
- The Sankey is legible for a month with 1–15 categories on each side. For more than 15, the smallest flows are grouped into "Other" with an expand affordance.
- Tooltip values are formatted in the user's selected currency with appropriate locale formatting.
- Keyboard navigation: Tab moves between nodes; Enter on a node filters the table; Escape clears the filter.

### Feature 3.2: Monthly cash flow — bar chart toggle

**Surface.** Cash flow tab. A toggle in the top-right of the chart area labeled `Sankey / Bars`.

**Behavior.**

1. The bar chart view replaces the Sankey when toggled. It shows the last 12 months (or all months if fewer than 12 exist).
2. For each month: two bars — total income (positive) and total expenses (negative, extending downward from the baseline). A line overlay shows net cash flow.
3. The selected month is visually emphasized (higher opacity, 2px stroke).
4. Clicking a month selects it and updates the rest of the tab.
5. Hovering shows a tooltip with exact values.
6. The toggle state persists in user settings.

**Edge cases.**

- **Fewer than 3 months of data**: bars are rendered with extra horizontal padding so the chart doesn't look empty.
- **Extreme outlier month** (one month with 10× the typical values): the chart uses a linear scale and does not offer log scaling in MVP. Copy below the chart: "One or more months contain outlier values. Click a month to view its breakdown."

**Acceptance.**

- Toggling between Sankey and bar chart is instant (< 50ms) and preserves the selected month.
- Both views interpret the same underlying data and display mathematically consistent totals.

### Feature 3.3: Transaction table

**Surface.** Cash flow tab, below the chart area. Always visible.

**Behavior.**

1. A flat table with columns: Date, Name, Category, Type (income/expense, shown as a single character badge: `+` or `−`), Amount, Recurring flag.
2. Default sort: Date descending.
3. Column headers are clickable to sort.
4. Filters in a thin bar above the table: text search (searches Name and Notes), category filter (multi-select), type filter (income / expense / both), recurring filter.
5. The table is dense — 32px row height, not 56px. Density is the point.
6. Tabular numbers are right-aligned and use the serif's lining figures with tabular spacing.
7. Amounts are formatted in the user's currency. Expense amounts are prefixed with `−`. Income amounts have no prefix. No `+` sign.
8. Row hover: background shifts to the Paper color.
9. Row click: opens the edit modal.
10. Bulk actions: a checkbox column appears when the user has multi-selected. Available bulk actions: Delete, Change category, Export selection.

**Edge cases.**

- **Very long name or notes**: truncated with ellipsis; full text in tooltip on hover.
- **More than 500 rows**: virtualize with TanStack Virtual. Keep sort and filter responsive.

**Acceptance.**

- The table is legible and usable with 1000+ transactions.
- Keyboard: arrow keys navigate rows, Enter opens the edit modal for the focused row.
- The table does not use shadcn/ui's Table component. It is hand-built. This is explicit.

### Feature 3.4: Empty state — cash flow tab

**Surface.** Cash flow tab, replacing the chart area and transaction table when no transactions exist for the selected month.

**Behavior.** Per the sourced empty state template from the PRD:

> **No transactions recorded for March 2026.**
> Net cash flow assumes zero until you add an entry. The Sankey and bar chart above will appear when you add your first entry this month.
> `[Add income]` `[Add expense]`

This is rendered as a centered block within the content area, using the body serif for the main line and the sans for the buttons. No illustration. No icon. The emptiness is not dressed up.

---

## Job 4: "I want to see what happens if I keep this up for 30 years."

This is the product's reason to exist.

### Feature 4.1: 30-year portfolio projection line chart

**Surface.** Projection tab, center column.

**Behavior.**

1. X-axis: years from 0 to 30. Y-axis: portfolio value in the user's currency.
2. A single line shows the total portfolio value across all 5 stocks over time.
3. Three labeled markers at x=10, x=20, x=30 years. Each marker has a callout showing the portfolio value at that year, formatted in the user's currency with a short form for large numbers (e.g., `₫1.2 tỷ`, `$1.2M`).
4. The contribution phase (years 0 through `investmentPlan.durationYears`, default 5) is rendered with a subtle background tint. The compound-only phase has no tint. A label at the phase boundary reads "Contributions end" in small sans.
5. Hovering the line shows a crosshair that snaps to the nearest month, with a tooltip showing year, month, and portfolio value at that point.
6. The line is drawn in `--ink` at 1.5px stroke weight. Emphasis is through weight and the background tint described in point 4, not color. There is no accent color — the monochrome design forbids it.
7. The chart updates live as the user changes the investment ratio, duration, or currency. Recompute must complete in under 50ms.

**Edge cases.**

- **User has no net cash flow data yet**: the projection uses a user-entered "expected average monthly net cash flow" that the UI prompts for. Copy: "Add a few months of transactions or enter an expected average below to see your projection."
- **Negative average net cash flow**: the projection is flat at zero. Copy: "Your average net cash flow is negative. The simulation assumes no investment contributions until your cash flow is positive."
- **User adjusts the random seed (reroll)**: the line redraws with a 400ms animation. The new seed is stored.

**Acceptance.**

- Line recompute on any input change is under 50ms p95.
- The 10/20/30-year values displayed match the values shown in the milestone readouts (Feature 4.5) exactly.
- The chart uses D3's line generator with a monotone cubic interpolation.

### Feature 4.2: Per-stock stacked area chart

**Surface.** Projection tab, accessible via a toggle in the chart area: `Total / Per stock / Contributions vs gains`.

**Behavior.**

1. Five stacked areas, one per stock in the portfolio.
2. Each stock is assigned a fixed `(tone, pattern)` pair from the 5-step tonal scale and the 5 SVG patterns, per the monochrome color system (PRD section 7.2). The mapping is declared once in the chart component's tokens file and must be stable across the product.
3. Legend shows stock ticker and its final-year contribution to total value.
4. Hover: tooltip shows each stock's value at that year, total, and each stock's percentage of total.
5. The stack order is by final value, largest at the bottom.

**Edge cases.**

- **Very similar growth across stocks**: the visualization is less interesting but still correct. No special handling.
- **One stock dramatically outperforms**: the chart correctly shows this; the smaller stocks compress at the top. No log-scale option in MVP.

**Acceptance.**

- The `(tone, pattern)` assignments are consistent between the stacked area and the portfolio legend elsewhere in the product.
- The chart is built with Recharts' `AreaChart` with `stackId="1"` on each Area.

### Feature 4.3: Contributions vs. investment gains chart

**Surface.** Projection tab, third option of the chart toggle.

**Behavior.**

1. Two stacked areas: **Contributions** (cumulative sum of all monthly investments made) on the bottom, **Gains** (portfolio value − contributions) on top.
2. This chart is the compounding visualization — it makes the crossover moment where gains exceed contributions visible.
3. A callout marker appears at the year where Gains first exceed Contributions, with copy: "Gains exceed contributions — year 12."
4. **Styling (monochrome).** Contributions is rendered as a solid fill in `--ink-subtle`. Gains is rendered in `--ink` with the diagonal-stripe pattern over it. The visual contrast between "quiet contributions" and "textured gains" carries the semantic weight that a color system would otherwise carry.

**Edge cases.**

- **Gains never exceed contributions** (very low return model, very long contribution window): no crossover marker. Copy below the chart: "Gains have not yet exceeded contributions in the 30-year horizon under current parameters."

**Acceptance.**

- The crossover year calculation is correct: iterate months, find first month where gains > contributions, display that year.
- The two areas sum to the total portfolio value shown in the main line chart.

### Feature 4.4: Investment plan form

**Surface.** Projection tab, left column.

**Behavior.**

1. Fields:
   - **Ratio**: slider (0% to 100%) with a numeric input coupled to it. Default 40%.
   - **Duration**: number input (1 to 30 years). Default 5.
   - **Expected average monthly net cash flow** (only shown when the user has less than 3 months of data): number input in user currency.
   - **Stocks**: a read-only list of the 5 pre-selected stocks with their μ and σ. Each has a small "override μ" button that reveals an input; the user can override the expected return but not σ in MVP.
2. Changes to any field recompute the projection live.
3. A `[Reset to defaults]` button below the form.
4. A `[Reroll simulation]` button with a small help icon: "The simulation uses random sampling to produce realistic variance. Reroll to see a different plausible outcome with the same parameters."

**Edge cases.**

- **User sets ratio to 0%**: the projection is flat at the contribution value (zero, since no contributions happen). Copy in the projection area: "With 0% ratio, no contributions are made. The chart shows zero."
- **User sets ratio to 100% but has negative average cash flow**: the projection is zero, as above. Copy explains.
- **User overrides μ to an unreasonable value** (e.g., 500%): accepted without warning. The product trusts the user. The resulting projection is absurd but mathematically correct.

**Acceptance.**

- Every input change triggers a projection recompute and chart redraw within 50ms.
- Form state persists in user settings via the Zustand store.
- The form is keyboard-complete.

### Feature 4.5: Milestone readouts

**Surface.** Projection tab, right column. Three stacked cards.

**Behavior.**

1. Each card displays: the year (10, 20, or 30), the portfolio value at that year, the total contributions made by that year, and the gains (value − contributions).
2. The values are set in the body serif at large size. The labels ("Year 10", "Total value", "Contributions", "Gains") are in the sans.
3. Values format with short-form for large numbers using locale-aware abbreviations.
4. Hovering a value shows the full, unabbreviated number in a tooltip.

**Edge cases.**

- **Very large portfolio value** (e.g., > 10^15 in VND with high contributions): the abbreviated form handles it (e.g., `1.2 nghìn tỷ`). Short-form vocabulary per currency is defined in the currency library.

**Acceptance.**

- The three values match the line chart's values at those points exactly.
- The cards are visually distinct from each other through size variation — the 30-year card is largest, 10-year is smallest. This is the editorial layout principle applied to a micro-composition.

---

## Job 5: "I want to do things quickly, without the mouse."

### Feature 5.1: Command palette

**Surface.** Invoked globally with ⌘K (Mac) or Ctrl+K (Windows/Linux). Also visible as a persistent bottom-right hint: `⌘K to do anything`.

**Behavior.**

1. A modal overlay with a search input at the top and a scrollable list of commands below.
2. Commands are organized by category but presented flat when the user types.
3. Fuzzy search matches command names and aliases. The matching algorithm prioritizes: exact prefix match > word boundary match > subsequence match.
4. Recent commands (last 10 used) bubble to the top when the search is empty.
5. Arrow keys navigate; Enter executes; Escape closes.
6. Some commands accept arguments inline. Example: typing "add income 500 salary" pre-fills the add income modal.

**Command list (MVP).**

- `Add income [amount] [category]` — opens the add income modal, optionally pre-filled
- `Add expense [amount] [category]` — opens the add expense modal, optionally pre-filled
- `Go to cash flow` — navigates to cash flow tab
- `Go to projection` — navigates to projection tab
- `Go to settings` — navigates to settings
- `Set investment ratio [percentage]` — updates the ratio, moves to projection tab if not already there
- `Set currency [code]` — updates the currency
- `Export CSV` — downloads the CSV
- `Import CSV` — opens the import modal
- `Reroll simulation` — generates a new seed
- `Toggle theme` — cycles through light/dark/system
- `Toggle chart: Sankey` — switches cash flow chart to Sankey
- `Toggle chart: Bars` — switches cash flow chart to bars
- `Load sample data` — populates the app with a demo dataset (with a confirmation if data already exists)
- `Clear all data` — nuclear option, triple-confirmed
- `Show keyboard shortcuts` — opens the shortcut reference overlay

**Edge cases.**

- **Command argument parsing fails** (e.g., "set investment ratio banana"): the command shows a hint below the input in Fraunces italic: "Expected a percentage between 0 and 100." The command does not execute.
- **Duplicate command names via user aliasing**: not supported in MVP.

**Acceptance.**

- Opening the palette and executing a common command takes under 2 seconds for a practiced user.
- All commands that produce modals correctly pass the argument-parsed values into the modal's initial state.
- The palette is accessible (proper ARIA), keyboard-complete, and screen-reader-friendly.

### Feature 5.2: Keyboard shortcuts (outside the command palette)

**Surface.** Active globally when no input is focused.

**Behavior.**

| Shortcut        | Action                                     |
| --------------- | ------------------------------------------ |
| `⌘K` / `Ctrl+K` | Open command palette                       |
| `I`             | Add income                                 |
| `E`             | Add expense                                |
| `1`             | Go to cash flow tab                        |
| `2`             | Go to projection tab                       |
| `3`             | Go to settings                             |
| `?`             | Show keyboard shortcut reference           |
| `Esc`           | Close modal / clear filter / cancel action |
| `/`             | Focus the transaction search               |
| `⌘F` / `Ctrl+F` | Focus the transaction search               |
| `⌘,` / `Ctrl+,` | Open settings                              |

**Edge cases.**

- **Shortcuts while a modal is open**: only Escape is honored. Other shortcuts are suppressed.
- **Shortcuts while an input is focused**: suppressed entirely. The user is typing.

**Acceptance.**

- All shortcuts are discoverable via the `?` reference.
- No shortcut conflicts with standard browser shortcuts that users rely on (e.g., ⌘R, ⌘T).

---

## Job 6: "I want to own my data and be able to leave."

### Feature 6.1: CSV export

**Surface.** Settings page, and command palette (`Export CSV`).

**Behavior.**

1. One-click download of a file named `flowstate-export-YYYY-MM-DD.csv`.
2. The CSV contains three sections separated by blank lines:
   - **Transactions**: header row then all transactions
   - **Categories**: header row then all category definitions (including user-created ones)
   - **Settings**: header row then a single row with current settings (currency, investment plan, stock overrides)
3. Alternative: offer a `.zip` containing three separate CSVs for users who prefer that structure. Toggle in settings.

**CSV schema (Transactions section).**

```
type,name,amount,currency,date,category,notes,recurring,recurring_until,created_at,updated_at,id
income,Salary,50000000,VND,2026-01-15,Salary,"January pay",true,,2026-01-15T10:00:00Z,2026-01-15T10:00:00Z,018f3a...
```

Amount is in the smallest currency unit (e.g., VND đồng, US cents) as an integer. This avoids floating-point issues across Excel/Google Sheets/Numbers.

**Edge cases.**

- **Notes containing commas or quotes**: CSV-quoted per RFC 4180.
- **Empty export** (no data): still produces a valid CSV with headers only.

**Acceptance.**

- The exported CSV round-trips cleanly through the import feature.
- The exported CSV opens correctly in Excel, Google Sheets, and Numbers without mangling.

### Feature 6.2: CSV import

**Surface.** Settings page, command palette (`Import CSV`), and a prominent button on the empty-state cash flow tab.

**Behavior.**

1. File picker or paste-into-modal. Both accepted.
2. The system validates the CSV against the schema. Invalid rows are shown in a preview table with row-level error messages.
3. The user sees a preview of all rows and can uncheck any before confirming.
4. On confirm: valid rows are inserted. Invalid rows are skipped. A summary toast reports successes and skips.
5. If the import contains data that would duplicate existing entries (same date, name, amount), the system prompts: "X potential duplicates detected. Skip / Import anyway / Cancel."

**Edge cases.**

- **CSV missing required columns**: the import halts with a clear error: "Column 'amount' is required. The uploaded file has: [list of found columns]."
- **Wrong currency in CSV vs. user's selected currency**: the import prompts: "The imported data is in USD but your current currency is VND. Import as-is (values will be wrong) / Cancel to change currency first."

**Acceptance.**

- Importing a previously-exported CSV produces an identical dataset.
- Import of a messy user-generated CSV (wrong column order, extra columns, mixed quote styles) handles gracefully.

---

## Job 7: "I want to configure this product to match how I think."

### Feature 7.1: Currency selection

**Surface.** First-load modal (required), Settings page, command palette.

**Behavior.**

1. First load: a modal prompts the user to confirm currency. The default is inferred from `navigator.language` (e.g., `vi-VN` → VND, `en-US` → USD) but always shown for confirmation.
2. Available currencies: VND, USD, EUR, GBP, JPY, SGD, AUD.
3. Changing currency later does not convert existing values. A warning copy: "Changing currency does not convert your existing transaction amounts. Values will be re-displayed with the new currency symbol but the numbers will not change. If you need conversion, export your data first."

**Acceptance.**

- All currency-sensitive formatting (transaction amounts, milestone readouts, chart tooltips) updates immediately on currency change.
- The short-form abbreviation vocabulary is correct per currency (e.g., `₫1.2 tỷ` for VND, not `₫1.2B`).

### Feature 7.2: Category management

**Surface.** Settings page, inline `+ New category` in relevant dropdowns.

**Behavior.**

1. Two lists: income categories and expense categories.
2. Each category has: label, `(tone, pattern)` assignment (from the monochrome chart token palette), display order (drag to reorder).
3. Create, rename, delete. Deleting a category with associated transactions prompts: "Move X transactions to [select another category] / Cancel."
4. The default categories cannot be deleted but can be renamed and reordered. (Renaming is allowed because localized users may prefer "Groceries" over "Food" or "Rent" over "Housing.")

**Edge cases.**

- **Creating a category with a duplicate name**: prevented with a visible validation message.
- **More than 20 categories in a list**: soft warning. The Sankey collapses cleanly because it's been designed for this.

**Acceptance.**

- Category changes are reflected everywhere (dropdowns, Sankey, filters) on the next render.
- Category `(tone, pattern)` assignments are stable — the same category shows the same visual treatment across all views.

### Feature 7.3: Theme (light / dark / system)

**Surface.** Settings, command palette (`Toggle theme`).

**Behavior.**

1. Three options: Light, Dark, System (follow OS setting).
2. Default: System.
3. Theme change is instant — no page reload. CSS custom properties update.
4. All charts re-render with theme-appropriate colors.

**Acceptance.**

- No flash of incorrect theme on first load (use the standard theme-detection script inlined in the Astro layout).
- Charts are equally legible in both themes.

---

## Job 8: "I want to trust that the numbers are real."

### Feature 8.1: Simulation methodology panel

**Surface.** Projection tab, a subtle "How this works" link below the chart. Opens a modal or a side sheet.

**Behavior.** A readable explanation, in the product's own typographic voice, covering:

1. **How monthly returns are generated.** Shows the lognormal formula with variables labeled. Explains in plain language: "Each month, each stock's return is drawn from a lognormal distribution parameterized by its expected annual return and its historical volatility."
2. **Why lognormal, not normal.** Two sentences: stock prices can't go below zero; compounding returns are naturally lognormal.
3. **Where μ and σ come from.** "μ is set at a defensible value based on roughly 10 years of historical returns. σ is the annualized standard deviation of monthly returns over the same period. Both values are rounded for clarity."
4. **What the variance represents.** "The simulation produces a plausible trajectory. Rerolling with the same parameters produces a different trajectory. Neither is a prediction."
5. **What determinism means.** "The same inputs produce the same trajectory until you reroll. This is so that adjusting the ratio changes the projection because of the ratio, not because of new random numbers."
6. **What the Monte Carlo extension would add.** A note that running many simulations and showing percentile bands is the more rigorous approach, and that this is planned for a future version.

**Acceptance.**

- The panel is readable by a non-technical user. No jargon is used without immediate explanation.
- The panel exists specifically so the student can cite it when explaining the product to the instructor.

### Feature 8.2: Stock parameter table

**Surface.** Projection tab, near the investment plan form.

**Behavior.**

1. A compact table showing the 5 stocks with columns: Ticker, Name, μ, σ, [override] button.
2. Clicking "override" on a row reveals an inline input for μ. σ is read-only in MVP.
3. When a user has overridden any μ, a banner reads: "You've overridden 1 expected return. Values will reset on [Reset to defaults]."

**Acceptance.**

- Overrides persist in user settings.
- The table's typography uses the tabular figures from the serif; values align on the decimal.

---

## Cross-cutting concerns

### Accessibility

- All interactive elements have accessible labels.
- Color contrast meets WCAG AA. In a monochrome system this is simpler to verify: `--ink` and `--ink-strong` on `--canvas` both exceed 4.5:1; `--ink-muted` on `--canvas` meets 4.5:1 for body text; `--ink-subtle` is reserved for large-format labels and decorative elements where 3:1 suffices.
- Charts include a "Show data as table" affordance for screen readers: every chart has an equivalent table view one keypress away.
- The command palette is fully navigable with a keyboard and properly announces itself to screen readers.

### Responsive behavior

- Desktop-first design. Laptop (1280px+) is the primary target.
- Tablet (768–1279px): the projection tab collapses its three columns into a stacked layout with the plan form at the top.
- Mobile (< 768px): the Sankey gracefully degrades to a vertically-scrolled bar view with copy explaining "The Sankey diagram is best viewed on a larger screen. This is a simplified view." The transaction table becomes a list of cards. The command palette works but is less prominent.

### Error boundaries

- Every route has a React error boundary that renders an honest error state per the template. The error reports: what action the user was attempting, what error was caught, and a Copy Error Details button that copies a JSON blob to the clipboard (not raw stack traces shown to the user).

### Analytics

- **MVP has no analytics.** This is deliberate. Anonymous usage telemetry, if added post-MVP, goes behind an explicit user opt-in on first load, and the opt-in copy is honest about what is collected.

---

## Implementation sequencing

> **Note on scope.** This is the full-MVP build plan assuming the assignment's one-month timeline. For the three-day academic delivery, see PRD section 3.4 — that section names the narrower subset that ships by the deadline. The phases below are the plan for completing the full MVP after submission.

The recommended build order. Each phase produces a shippable artifact.

### Phase 0: Foundation (3 days)

- Astro project setup on Cloudflare Pages
- Design tokens in CSS custom properties
- Typography base (import fonts, set up the serif/sans/mono cascade)
- Tailwind configured for layout utilities only
- CSS module conventions documented
- The `Repository` interface defined, LocalStorage implementation stubbed
- The projection engine scaffolded with a simple test

### Phase 1: Cash flow loop (5 days)

- Add income / add expense modals
- Transaction table
- Monthly calculation logic
- Bar chart (Sankey deferred — harder)
- Empty states
- Category management
- Currency selection
- Basic settings page

### Phase 2: Sankey and projection (5 days)

- Sankey diagram with D3
- Investment plan form
- Projection engine (lognormal return model, deterministic seed)
- 30-year line chart
- Milestone readouts
- Simulation methodology panel

### Phase 3: The other two charts (2 days)

- Per-stock stacked area
- Contributions vs. gains
- Chart toggle mechanism

### Phase 4: Keyboard-first and polish (3 days)

- Command palette
- Keyboard shortcut system
- Tactile micro-interactions (button presses, input shake, milestone confetti)
- Theme system (light/dark)
- Accessibility audit

### Phase 5: Data portability (2 days)

- CSV export
- CSV import with validation
- Migration scaffolding

### Phase 6: Hardening (2 days)

- Error boundaries
- Performance pass (hit the budgets in the PRD)
- Responsive behavior for tablet/mobile
- Lighthouse audit
- Playwright test suite for the critical paths

**Total: ~22 working days for the MVP.**

Post-MVP (WorkOS AuthKit, Cloudflare D1, live stock data, Monte Carlo) is a separate roadmap.

---

## Glossary

- **Net cash flow**: monthly income minus monthly expenses. Can be negative.
- **Investment ratio**: percentage of positive net cash flow allocated to investment each month.
- **Investment duration**: number of years the user contributes. Default 5 per the assignment.
- **Projection horizon**: the full simulation length. 30 years, fixed in MVP.
- **μ (mu)**: expected annual return of a stock. Scalar.
- **σ (sigma)**: annualized standard deviation of monthly returns. Scalar.
- **Seed**: a deterministic parameter controlling the random draws. Changing the seed changes the trajectory; the same seed with the same inputs produces the same trajectory.
- **Compounding phase**: the portion of the projection after contributions have ended, during which existing holdings continue to grow.
- **Repository**: a pattern encapsulating data access. The product has one for transactions; it's implemented by LocalStorage in MVP and will be implemented by D1 in production.