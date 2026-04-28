# Flowstate — Information Architecture

> Where things live. How the user moves between them. Which Carbon UI Shell pieces compose the chrome. Read this before designing any individual page.

## 1. Top-level layout — Carbon UI Shell

Every page renders inside the Carbon UI Shell. The Shell is the persistent chrome; pages are the variable content area.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Header (cds--header)                                                   │
│ ┌──┬─────────────────────┬──────────────────────────────┐             │
│ │☰ │ Flowstate           │ Currency · Theme · Settings  │             │
│ └──┴─────────────────────┴──────────────────────────────┘             │
├────────┬───────────────────────────────────────────────────────────────┤
│ SideNav│ Page content area                                             │
│        │                                                                │
│ ⌂ Dash │ ┌─────────────────────────────────────────────────────────┐   │
│ ↕ Cash │ │  <Grid>                                                  │   │
│ ⊙ Sim  │ │    <Column lg={16}>                                      │   │
│ ⎘ Rep  │ │      ...                                                 │   │
│ ⚙ Set  │ │    </Column>                                             │   │
│        │ │  </Grid>                                                 │   │
│        │ └─────────────────────────────────────────────────────────┘   │
└────────┴───────────────────────────────────────────────────────────────┘
```

Carbon component map:

| Region | Component(s) |
|---|---|
| Outer wrapper | `<Theme theme="g90">` (default; switchable) |
| Header | `<Header>`, `<HeaderName>`, `<HeaderMenuButton>`, `<HeaderGlobalBar>`, `<HeaderGlobalAction>` |
| SideNav | `<SideNav>`, `<SideNavItems>`, `<SideNavLink>`, `<SideNavMenu>`, `<SideNavMenuItem>` |
| Skip-to-content | `<SkipToContent>` (mounted first child of `<Header>`) |
| Page-content shell | `<Content>` (`@carbon/react`'s named export), then `<Grid condensed?={false}>` |

## 2. Page map

Five top-level routes. Each is a SideNav entry. The route names are public-facing and stable.

| # | Route | Title | One-line purpose |
|---|---|---|---|
| 1 | `/` | Dashboard | Single-page condensed snapshot. The default landing page. |
| 2 | `/cash-flow` | Cash Flow | Combined income + expense entry, monthly table, monthly chart. |
| 3 | `/simulation` | Simulation | Investment ratio, stock picks, projection chart, milestone Tiles. |
| 4 | `/reports` | Reports | Export, screenshots-for-grading view, demo-data toggle. |
| 5 | `/settings` | Settings | Currency, theme, data reset, Finnhub key entry, FX cache controls. |

**Out of nav** (reachable but not in SideNav):

- `/onboarding` — first-run wizard (auto-redirected to on empty state). Three steps: pick currencies, pick five tickers, set ratio. Skippable into demo data.
- `/404` and `/error` — standard.

### 2.1 Why these five and not more

The brief asks for income management, expense management, net flow display, investment simulation, and milestone projection. The mapping is intentional:

- **Income + expense in one route (`/cash-flow`)** — explicit user request. The two are the same data type with opposite signs; a tab inside the route ("Income" / "Expenses" / "All") is sufficient and avoids a redundant nav entry. The combined table makes net flow self-evident.
- **Dashboard as a separate, condensed view** — explicit user request. The single-page dashboard is the at-a-glance answer to "where am I?", not a duplicate of `/cash-flow` or `/simulation`. It crops the most expensive features (full transaction table, full projection-chart hover behavior, deep stock pick UI) so the screen estate fits.
- **Reports as a route** — the assignment requires screenshots, demo video, and a written report. A dedicated page makes the "what to capture" obvious and gives a single click target during the demo.

## 3. Header anatomy (left-to-right)

| Slot | Element | Notes |
|---|---|---|
| 1 | `<HeaderMenuButton>` | Toggles SideNav on small breakpoints. Hidden on `lg+`. |
| 2 | `<HeaderName prefix="Flow">state</HeaderName>` | Word-mark only. No logo image (avoids any IBM-trademark proximity). |
| 3 | *(spacer)* | Default flex behavior. |
| 4 | `<HeaderGlobalAction aria-label="Currency">` → opens `<Popover>` with `<RadioButtonGroup>` `VND / USD`. | Active currency shown in button via small text label, not flag emoji. |
| 5 | `<HeaderGlobalAction aria-label="Theme">` → cycles `g90 → g100 → white → g90`. Icon: `Asleep` / `Light`. | Persists in LocalStorage. |
| 6 | `<HeaderGlobalAction aria-label="Settings">` → links to `/settings`. Icon: `Settings`. | |

No search in the header. No user menu (no auth in MVP). No notification bell (nothing to notify about).

## 4. SideNav anatomy

Default state: **expanded** on `lg+`, **collapsed** (rail-only icons) on `md`, **closed** on `sm` (opens via header menu button).

```tsx
<SideNav aria-label="Primary navigation" isRail>
  <SideNavItems>
    <SideNavLink renderIcon={Dashboard}    href="/">/Dashboard</SideNavLink>
    <SideNavLink renderIcon={ArrowsVertical} href="/cash-flow">Cash Flow</SideNavLink>
    <SideNavLink renderIcon={ChartLineSmooth} href="/simulation">Simulation</SideNavLink>
    <SideNavLink renderIcon={Report}        href="/reports">Reports</SideNavLink>
    <SideNavDivider />
    <SideNavLink renderIcon={Settings}      href="/settings">Settings</SideNavLink>
  </SideNavItems>
</SideNav>
```

The active route is decorated with Carbon's built-in `aria-current="page"` and the `cds--side-nav__item--active` class.

No nested submenus in the MVP. Future Reports → Export sub-items would use `<SideNavMenu>`.

## 5. Routing — Next.js App Router file structure

```
app/
├── layout.tsx              # <Theme>, <Header>, <SideNav>, <Content>
├── page.tsx                # / (Dashboard)
├── cash-flow/
│   └── page.tsx
├── simulation/
│   └── page.tsx
├── reports/
│   └── page.tsx
├── settings/
│   └── page.tsx
├── onboarding/
│   └── page.tsx            # standalone layout, no SideNav
├── api/
│   ├── tickers/
│   │   ├── search/route.ts # GET /api/tickers/search?q=  → Finnhub /search
│   │   └── quote/route.ts  # GET /api/tickers/quote?symbol=  → Finnhub /quote
│   └── fx/
│       └── latest/route.ts # GET /api/fx/latest → open.er-api.com cached
├── error.tsx
└── not-found.tsx
```

Server components for static layout. Client components ("use client") only where state is needed: forms, charts (Carbon Charts is React-state-driven), the projection page.

## 6. Page-level grid usage

Every page begins with the standard Carbon 2x Grid:

```tsx
<Grid>
  <Column sm={4} md={8} lg={16}>
    <h1 className="cds--type-productive-heading-04">Cash flow</h1>
  </Column>
  {/* … */}
</Grid>
```

Page-section breaks use `<Column lg={16}>` rows. Sub-layouts (e.g. side-by-side editor + table on `/cash-flow`) use nested `<Column>` widths summing to 16 at `lg`.

Standard breakpoints (Carbon's): `sm` (320), `md` (672), `lg` (1056), `xlg` (1312), `max` (1584). Flowstate's primary breakpoint is `lg`. The Dashboard is denser at `xlg`.

## 7. Empty / loading / error state policy

Carbon ships specific solutions; Flowstate uses them.

| State | Component | Where used |
|---|---|---|
| **Empty** (no data yet) | `<Pictogram>` + `<Heading>` + `<p className="cds--type-body-01">` + primary `<Button>` | First-visit Cash Flow ("No transactions yet — add your first income"). First-visit Simulation ("Pick five stocks to begin"). |
| **Loading (full page)** | `<Loading description="Loading…" withOverlay />` | Initial Finnhub search response on a slow link. |
| **Loading (inline)** | `<InlineLoading description="Saving…" status="active" />` | Form submits, FX refresh button. |
| **Skeleton** | `<DataTableSkeleton>`, `<SkeletonText>`, `<SkeletonPlaceholder>` | Cash Flow table while transactions hydrate from LocalStorage. (Brief flash; ≤ 1 frame typical.) |
| **Error** | `<InlineNotification kind="error">` (in-flow) or `<ToastNotification kind="error">` (out-of-flow) | Finnhub rate-limit, FX fetch failure, malformed CSV import. |
| **Validation** | `invalid` + `invalidText` props on form components (`<TextInput>`, `<NumberInput>`, `<DatePicker>`) | Per-field. Error icon + token-driven `support-error` color. |

No cartoon illustrations. Pictograms are Carbon's official set only. Empty-state copy is concrete and action-oriented (templates in [04_feature_spec.md](04_feature_spec.md)).

## 8. Keyboard navigation

The whole app is operable via keyboard alone. The `<SkipToContent>` link is the first focusable element. The standard Carbon focus rings (`$focus`, `$focus-inset`) are honored — no `outline: none` overrides.

Page-level shortcuts (registered via a single `useKeyboardShortcuts` hook on the root layout):

| Shortcut | Action |
|---|---|
| `g` then `d` | Go to Dashboard |
| `g` then `c` | Go to Cash Flow |
| `g` then `s` | Go to Simulation |
| `g` then `r` | Go to Reports |
| `n` | New transaction (on `/cash-flow`) |
| `t` | Cycle theme |
| `?` | Open shortcut cheatsheet (`<Modal>`) |

Shortcuts do not fire when focus is in a text input. The cheatsheet `<Modal>` lists them in a `<StructuredList>`.

## 9. Accessibility floor

Every page must clear:

- All interactive elements have an accessible name (`aria-label`, visible label, or `iconDescription` for icon-only Carbon buttons).
- Color is never the only channel for state; status pairs color with an icon (`<InlineNotification>`, `<Tag>` with icon, etc.).
- Form inputs are associated with labels; errors use `invalid` + `invalidText` (which Carbon wires up `aria-describedby` for).
- Tables (Cash Flow transactions, Simulation milestone breakdown) use `<DataTable>`'s built-in semantics — `<table>` + `<thead>` + `<th scope>`, never CSS-only grids for tabular data.
- `<Theme>` boundaries are explicit so contrast is correct.
- Charts have a text alternative — Carbon Charts auto-generates one; D3 charts require an explicit `<table className="cds--visually-hidden">` mirror.
- Lighthouse a11y score ≥ 95 on every page.
