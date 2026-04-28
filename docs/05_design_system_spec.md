# Flowstate — Design System Spec (Carbon discipline)

> Which Carbon tokens, components, and patterns Flowstate uses; which it does not; the rules for charts; and the audit checklist that gates "done." This is the bouncer at the door — code that doesn't pass this is not Carbon-grade and is not Flowstate-grade.

## 1. Token discipline — the cardinal rule

Every color, spacing, type, motion, and breakpoint value emitted by Flowstate is a Carbon token. This is non-negotiable.

| Don't | Do |
|---|---|
| `color: #161616` | `color: var(--cds-text-primary)` |
| `padding: 16px` | `padding: var(--cds-spacing-05)` |
| `font-size: 14px; line-height: 18px` | `@include type.type-style('label-02')` |
| `@media (min-width: 1056px)` | `@include layout.breakpoint('lg')` |
| `transition: 240ms ease-in-out` | `transition: $duration-moderate-01 motion(standard, productive)` |
| `border: 1px solid #393939` | `border: 1px solid var(--cds-border-subtle-01)` |

A pixel literal in a CSS file is a code smell. ESLint + Stylelint enforce token usage where mechanically detectable; PR review covers the rest.

## 2. Theme strategy

Default: **g90** (Gray 90, dark productive). User-toggleable to **g100** and **white** via the header. `g10` is not exposed in the toggle (it's nearly identical to `white` for the user's purposes; we keep one light option).

Theme application:

```tsx
// app/layout.tsx
<Theme theme={settings.theme}>
  <Header>...</Header>
  <SideNav>...</SideNav>
  <Content>{children}</Content>
</Theme>
```

The header `<HeaderGlobalAction>` cycles theme. Persistence is in `Settings.theme`. The initial render reads from a server-side cookie set by middleware to avoid a flash-of-wrong-theme on first paint.

**Code uses theme tokens** (`text-primary`, `layer-01`, `border-subtle-01`, `support-error`), **not raw palette steps** (`gray-100`, `blue-60`). Raw palette is reserved for chart series colors and a small set of decorative cases — see §6.

## 3. Components in scope (use these — do not re-implement)

### Form & input

`<Button>` (primary, secondary, tertiary, ghost, danger), `<TextInput>`, `<TextArea>`, `<NumberInput>`, `<PasswordInput>`, `<DatePicker>`, `<DateRangePicker>`, `<Select>`, `<Dropdown>`, `<ComboBox>`, `<MultiSelect>`, `<RadioButtonGroup>`, `<Checkbox>`, `<CheckboxGroup>`, `<Toggle>`, `<Slider>`, `<FileUploader>`.

### Data display

`<DataTable>` (with `<TableToolbar>`, `<TableBatchActions>`, sticky headers, expandable rows, `<DataTableSkeleton>`), `<StructuredList>`, `<ContainedList>`, `<Tile>` (Tile, ClickableTile, SelectableTile, ExpandableTile), `<Tag>` (with type prop for status colors).

### Feedback

`<InlineNotification>`, `<ActionableNotification>`, `<ToastNotification>` (rendered into a `<NotificationGroup>` portal), `<Modal>`, `<ComposedModal>`, `<Loading>`, `<InlineLoading>`, `<SkeletonText>`, `<SkeletonPlaceholder>`.

### Navigation

`<Header>`, `<HeaderName>`, `<HeaderNavigation>` (not used; we don't have top nav links), `<HeaderMenuButton>`, `<HeaderGlobalBar>`, `<HeaderGlobalAction>`, `<SkipToContent>`, `<SideNav>`, `<SideNavItems>`, `<SideNavLink>`, `<SideNavDivider>`, `<Breadcrumb>` (used on `/settings` only — depth-2 nav helps in the future), `<Tabs>` + `<TabList>` + `<TabPanels>`.

### Layout

`<Theme>`, `<Grid>`, `<Column>`, `<Stack>`, `<FlexGrid>` (only if absolutely needed; the standard Grid covers Flowstate), `<Layer>` (used to nest one Tile inside another's surface).

### Progress & process

`<ProgressIndicator>` (onboarding), `<ProgressBar>` (CSV import).

### Typography utility

`<Heading>` + `<Section>` for semantic heading levels; `cds--type-*` classes inline for one-offs.

## 4. Components OUT of scope

Not used in the MVP. If a feature seems to need one, the feature is probably out of scope:

`<Pagination>`, `<PaginationNav>` (data is small; no pagination needed), `<TreeView>`, `<Accordion>` (no FAQ section), `<CodeSnippet>`, `<ContentSwitcher>` (we use `<Tabs>` instead — wider semantics), `<TimePicker>` (date-only granularity), `<Tooltip>` (we rely on built-in component tooltips, no ad-hoc tooltips on text), `<Popover>` only inside header for currency switcher; not for general use.

`@carbon/ibm-products` is **not** added unless an MVP requirement appears that Carbon core cannot solve. Currently none.

## 5. Typography

The IBM Plex stack, loaded via Carbon's font CDN reference (or `@ibm/plex` from npm if offline-first). Font stack:

- `IBM Plex Sans` — UI chrome, body, labels
- `IBM Plex Serif` — large headlines on the Reports print summary only
- `IBM Plex Mono` — ticker symbols, JetBrains-Mono replacement, code-like contexts

Carbon type styles (use these, not ad-hoc sizes):

| Use | Style |
|---|---|
| Page heading | `productive-heading-05` (32 / 1.25) |
| Sub-heading | `productive-heading-04` (28 / 1.286) |
| Section heading | `productive-heading-03` (20 / 1.4) |
| Body | `body-01` (14 / 1.43) |
| Body compact | `body-compact-01` (14 / 1.286) |
| Label | `label-01` (12 / 1.34) |
| Helper | `helper-text-01` (12 / 1.34) |
| KPI numbers | `productive-heading-05` with `tabular-nums` |
| Tabular numerals (table cells, milestone Tiles) | `body-compact-01` + `font-variant-numeric: tabular-nums` |

Ticker symbols on the Simulation page render in `IBM Plex Mono` at `productive-heading-04` size — the only place mono shows up at heading size.

## 6. Color & status conventions

### 6.1 Theme tokens for chrome

UI chrome — backgrounds, borders, text, layers — uses theme tokens:

- `background`, `layer-01`, `layer-02`, `field-01`, `field-02`
- `text-primary`, `text-secondary`, `text-helper`, `text-on-color`
- `border-subtle-01`, `border-subtle-02`, `border-strong-01`
- `interactive`, `link-primary`, `focus`, `focus-inset`

These re-map per theme automatically. Code does not branch on theme.

### 6.2 Status tokens for state

Carbon's `support-*` tokens carry status meaning:

- `support-error` — red, for negative net flow rows, validation errors, danger destructive actions
- `support-warning` — yellow, for "fewer than 5 tickers picked" notice, FX cache stale warning
- `support-success` — green, for income tags, "import successful" toast
- `support-info` — blue, for informational notifications

Status is **always paired with an icon** (`<InlineNotification>` includes one by default; `<Tag>` accepts a `renderIcon` prop). Color is never the only channel.

### 6.3 Palette steps for chart series

`@carbon/charts` defaults are honored. Override only for series count > 14 (we never exceed 3) or to enforce specific accessibility contrasts. The three projection scenarios use Carbon's standard `data-vis` palette positions 1, 2, 3 (the `Cyan`, `Purple`, `Magenta` family by default in `g90`). They re-color automatically across themes.

### 6.4 What we don't do

- **No raw hex codes in TSX or SCSS.** Even for "just one decorative thing." Ever.
- **No gradients.** Carbon has no gradient tokens. Not because they look bad but because they communicate nothing in this product.
- **No custom semantic palette.** "Brand blue" does not exist. Carbon's `interactive` token is the brand color and that's enough.

## 7. Spacing & grid

### 7.1 Spacing scale

Carbon's spacing scale (`spacing-01` … `spacing-13`). The most common values:

| Token | px | Used for |
|---|---|---|
| `spacing-03` | 8 | Inline gap, small icon-text gap |
| `spacing-05` | 16 | Default Tile padding, form field gap |
| `spacing-06` | 24 | Section gap inside a Tile |
| `spacing-07` | 32 | Page-section vertical rhythm |
| `spacing-09` | 64 | Page heading bottom margin |

Never use values outside the scale. Never use `0.5rem` or `18px` as a one-off.

### 7.2 Grid

The Carbon 2x grid lays out every page. `<Grid>` + `<Column>`. Column widths sum to `lg={16}`. Standard breakpoints (don't redefine):

| Breakpoint | Min width | Cols | Gutter |
|---|---|---|---|
| `sm` | 320 | 4 | 16 |
| `md` | 672 | 8 | 16 |
| `lg` | 1056 | 16 | 16 |
| `xlg` | 1312 | 16 | 16 |
| `max` | 1584 | 16 | 16 |

Inside a single component, native CSS flex/grid is fine.

## 8. Charts — Carbon Charts vs D3

### 8.1 The rule

> **Carbon Charts first.** Use D3 only when Carbon Charts cannot express the visual.

Carbon Charts ships theming, accessibility, tooltips, legends, downloads, and responsive behavior — all of which a hand-rolled D3 chart must reproduce. The cost of "I'll just D3 this" is consistently underestimated.

### 8.2 Chart-by-chart

| Page | Chart | Library | Reason |
|---|---|---|---|
| Dashboard | 30-year line chart, condensed | `@carbon/charts-react` `<LineChart>` | Standard. |
| Cash Flow | Inflow/outflow bars + net flow line | `@carbon/charts-react` `<ComboChart>` | Carbon supports dual-axis combo. |
| Simulation | 30-year area chart, three series with thresholds | `@carbon/charts-react` `<AreaChart>` | Carbon supports thresholds + multi-series. |
| Reports (print) | Static thumbnail variants of the above | Same components, smaller size | Reuse. |
| *(if added)* Sankey of net flow → investment → 5 stocks | **D3** | Carbon Charts has no Sankey. Stretch goal only. |

### 8.3 D3 rules — when justified

- D3 charts must produce a token-coloured output. No raw hex. SVG fills resolve to `var(--cds-charts-1)`, `var(--cds-charts-2)`, etc.
- D3 charts must include a `<table className="cds--visually-hidden">` text alternative for screen readers.
- D3 charts must respect Carbon themes. The chart re-renders on theme change.
- D3 charts must replicate Carbon Charts' tooltip pattern (Carbon `<Tooltip>` component placement; not a custom tooltip).
- A D3 chart's wrapper component must list which Carbon Charts behaviors it has reproduced and which it has skipped, in a comment block at the top of the file.

D3 is opt-in; the default is Carbon Charts.

## 9. Motion

Carbon defines durations and easings. Use them.

| Token | Duration | Use |
|---|---|---|
| `duration-fast-01` | 70ms | Hover state changes |
| `duration-fast-02` | 110ms | Small UI changes (focus rings) |
| `duration-moderate-01` | 150ms | Inline expand/collapse |
| `duration-moderate-02` | 240ms | SideNav expand, modal fade |
| `duration-slow-01` | 400ms | Large surface transitions |
| `duration-slow-02` | 700ms | Onboarding step transitions |

Easings: `motion(standard, productive)`, `motion(entrance, productive)`, `motion(exit, productive)`. Don't define cubic-béziers.

`prefers-reduced-motion` is honored — wrap any non-essential transition in a media query and short-circuit duration to 0.

## 10. Iconography

`@carbon/icons-react`. Sized at `16` (default), `20` (medium), `24` (button-leading), `32` (Tile decoration). Color inherits from text token.

`@carbon/pictograms-react` for empty states only. Sized at `48` or `64`. Color inherits from `text-secondary`.

No emoji as decoration. The minus glyph (`−`, U+2212) in tabular contexts is a typographic character, not an icon.

## 11. Accessibility floor

Hard requirements (every page):

- Lighthouse a11y ≥ 95.
- All interactive elements have an accessible name.
- All form inputs are labelled (Carbon's `labelText` is sufficient).
- Status uses color + icon.
- Focus rings use Carbon's `focus`/`focus-inset` tokens.
- Charts have a text alternative.
- Color contrast meets WCAG AA in all four themes (the default Carbon palette already does; check after any custom palette decisions).
- Keyboard-only operation completes the full primary flow.

## 12. Pre-merge audit checklist

Mental checklist run before any PR is opened. Every item is a tick or an explicit "N/A — reason."

```
[ ] All colors are theme/palette tokens — zero raw hex
[ ] All spacing is from the spacing scale — zero arbitrary px/rem
[ ] All breakpoints are Carbon — zero hardcoded media queries
[ ] All type is type-style — zero ad-hoc font-size/weight/line-height
[ ] All interactive primitives are Carbon — no hand-rolled buttons/inputs/modals
[ ] Every interactive element has an accessible name
[ ] Every form input is associated with a label
[ ] Focus styles use Carbon focus tokens — no `outline: none` orphans
[ ] State (error/warning/success) uses icon + token, never color alone
[ ] Theme is applied via <Theme> — no hardcoded backgrounds
[ ] Icons from @carbon/icons; pictograms from @carbon/pictograms
[ ] Motion uses Carbon durations + easings; reduced-motion honored
[ ] At most one kind="primary" Button per primary group
[ ] Modals use <Modal> or <ComposedModal>
[ ] Tables with row actions use <OverflowMenu>
[ ] Empty states use pictogram + heading + body + primary action
[ ] Charts default to @carbon/charts-react; D3 only with justification
[ ] Money values are integer minor units + currency tag
[ ] No `localStorage` calls in components — repository abstraction only
[ ] AI-PROCESS-LOG.md updated with the session entry
```

## 13. License & attribution (Carbon is Apache-2.0)

Carbon Design System is © IBM Corp., licensed Apache-2.0. Flowstate uses Carbon as a runtime dependency (`@carbon/react`, `@carbon/styles`, `@carbon/icons-react`, `@carbon/charts-react`); no source files are forked. Compliance:

- `THIRD_PARTY_NOTICES.md` at repo root lists each `@carbon/*` package, license, and copyright. Maintained on dependency add.
- IBM Plex fonts loaded from CDN by default. If self-hosted, `OFL.txt` ships with the font directory.
- The wordmark is "Flowstate" — not "IBM Flowstate" or anything that implies IBM endorsement.
- The IBM logo is never rendered.
- The student's report includes one sentence: "UI built with IBM's open-source Carbon Design System."
