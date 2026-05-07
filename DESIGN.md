---
name: Flowstate
description: Personal cash flow and long-term investment simulator built on IBM Carbon
colors:
  graphite-base: "#262626"
  graphite-raised: "#393939"
  graphite-elevated: "#525252"
  signal-blue: "#4589ff"
  lunar-white: "#f4f4f4"
  ash-grey: "#c6c6c6"
  smoke-grey: "#8d8d8d"
  alert-red: "#ff8389"
  growth-green: "#42be65"
  caution-amber: "#f1c21b"
typography:
  display:
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 300
    lineHeight: "40px"
    letterSpacing: "0"
  headline:
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: "36px"
    letterSpacing: "0"
  title:
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: "28px"
    letterSpacing: "0"
  body:
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0"
  label:
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0.32px"
  mono:
    fontFamily: "'IBM Plex Mono', 'Menlo', 'Courier New', monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0"
rounded:
  flat: "0"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.lunar-white}"
    rounded: "{rounded.flat}"
    padding: "11px 63px 11px 15px"
  button-primary-hover:
    backgroundColor: "#0062fe"
    textColor: "{colors.lunar-white}"
    rounded: "{rounded.flat}"
    padding: "11px 63px 11px 15px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.signal-blue}"
    rounded: "{rounded.flat}"
    padding: "11px 63px 11px 15px"
  button-danger:
    backgroundColor: "{colors.alert-red}"
    textColor: "{colors.graphite-base}"
    rounded: "{rounded.flat}"
    padding: "11px 63px 11px 15px"
  tile-default:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.lunar-white}"
    rounded: "{rounded.flat}"
    padding: "16px"
  input-default:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.lunar-white}"
    rounded: "{rounded.flat}"
    padding: "11px 16px"
  input-focused:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.lunar-white}"
    rounded: "{rounded.flat}"
    padding: "11px 16px"
  tag-income:
    backgroundColor: "transparent"
    textColor: "{colors.growth-green}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  tag-expense:
    backgroundColor: "transparent"
    textColor: "{colors.alert-red}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
---

# Design System: Flowstate

## 1. Overview

**Creative North Star: "The Long Exposure"**

Flowstate is designed like a long-exposure photograph: the result of sustained attention
accumulated over time. The interface does not animate to attract; it reveals through use. Where
most financial tools compete for the user's attention, Flowstate steps back, letting the numbers
speak in measured tones. The aesthetic is dark by circumstance (a person sitting with their
finances in a quiet hour, reviewing a 30-year projection by the light of a single screen) and
precise by commitment.

The design system is built entirely on IBM Carbon's g90 dark theme. This choice is not decorative;
it is structural. Carbon's token discipline means the interface shifts cleanly between g90, g100,
and white without a line of bespoke CSS. The discipline of the system is the integrity signal:
when every component behaves as it should, the user can trust the numbers behind it.

What this system explicitly rejects: the consumer warmth of retail fintech (Mint, YNAB) with its
pastels, progress streaks, and motivational copy; the noise of crypto dashboards with their neon
on black and ticker-tape anxiety; the hollow impressiveness of generic SaaS analytics with their
hero-metric cards, gradient numbers, and identical icon-heading-text tile grids; and the
information overload of investment-bank terminals (Bloomberg) with their monospace everything and
zero breathing room.

**Key Characteristics:**
- Carbon g90 dark as default: composed, focused, unhurried
- Zero custom CSS beyond font variable injection; the system is the spec
- Tonal depth through layered grays, never drop shadows
- IBM Plex Sans and Plex Mono as the sole type pairing: precise, readable, trustworthy
- Signal Blue (#4589ff) as the one interactive accent; used only for actions and active states
- Status communicated through color and icon together, never color alone

## 2. Colors: The Graphite and Signal Palette

A single commitment: deep graphite from IBM's Gray scale with one interactive accent (Signal Blue)
and semantic status colors. No brand color customization exists in the codebase. The restraint
is the point.

### Primary
- **Signal Blue** (#4589ff, `--cds-interactive`): The interactive accent. Used exclusively on
  buttons, links, active navigation indicators, focus rings, and chart series 1. Its rarity is
  the trust signal.

### Neutral
- **Graphite Base** (#262626, `--cds-background`): The page surface in g90. Deep without being
  black. Shifts to #161616 in g100 and #ffffff in white via CSS custom properties.
- **Graphite Raised** (#393939, `--cds-layer-01`): The primary content container. Used for Tiles,
  table bodies, form fields, and settings sections. Everything the user reads sits here.
- **Graphite Elevated** (#525252, `--cds-layer-02`, `--cds-border-subtle-01`): The second
  elevation step and subtle dividers. Used in nested containers, table row separators, and
  border lines within Raised surfaces.
- **Lunar White** (#f4f4f4, `--cds-text-primary`): Primary text. Clean, not stark white; at g90
  chroma this reads as warm rather than clinical.
- **Ash Grey** (#c6c6c6, `--cds-text-secondary`): Secondary text, sublabels, muted content.
  Approximately 70% of Lunar White in visual weight.
- **Smoke Grey** (#8d8d8d, `--cds-text-helper`): Helper text and placeholder text. The quietest
  readable tone in the system.

### Status
- **Alert Red** (#ff8389, `--cds-support-error`): Error states, expense amounts, destructive
  actions. Red 40 (lightened for dark backgrounds). Paired with a Warning or ArrowDown icon;
  never used as the sole indicator.
- **Growth Green** (#42be65, `--cds-support-success`): Income transactions and positive trend
  indicators. Paired with ArrowUp; never used alone.
- **Caution Amber** (#f1c21b, `--cds-support-warning`): InlineNotification warnings (FX
  unavailability, data gaps). Paired with a Warning icon; never used alone.

### Named Rules
**The CSS Custom Property Rule.** Every color in this system resolves through a CSS custom
property (`--cds-*`). The hex values in this document are the g90 resolved defaults for
documentation. Never hardcode hex in source. If a component looks wrong in the white theme,
the root cause is always a hardcoded color value.

**The Signal Rule.** Signal Blue appears on no more than 10% of any given screen surface. It
marks what can be acted on. When everything is blue, nothing is interactive.

## 3. Typography

**Primary Font:** IBM Plex Sans (system-ui fallback)
**Mono Font:** IBM Plex Mono (Menlo, Courier New fallback)

**Character:** Plex Sans is IBM's humanist grotesque: technical without coldness, readable under
sustained focus. At light weight and large sizes it reads like precision; at regular weight and
small sizes it reads like an instrument label. Plex Mono appears in code blocks, API key fields,
and any context where character-level precision is required.

The type scale is Carbon's productive scale exclusively, not the expressive scale. More
information-dense, no display drama. Every level serves comprehension.

### Hierarchy
- **Display** (weight 300, 32px/40px, `cds--type-productive-heading-05`): KPI values and
  milestone numbers. The largest thing on screen is always a number, not a heading.
- **Headline** (weight 400, 28px/36px, `cds--type-productive-heading-04`): Page-level section
  headings. Used once per major content zone.
- **Title** (weight 400, 20px/28px, `cds--type-productive-heading-03`): Sub-section headings,
  modal titles, tile headers.
- **Body** (weight 400, 14px/20px, `cds--type-body-01`): All prose, table content, form labels.
  Capped at 65-75ch line length in freeform text blocks.
- **Label** (weight 400, 12px/16px, letter-spacing 0.32px, `cds--type-label-01`): Input labels,
  helper text, table column headers, muted metadata.
- **Mono** (weight 400, 14px/20px, IBM Plex Mono): API key inputs, computed values requiring
  character-level precision.

### Named Rules
**The Productive Scale Rule.** Use Carbon's productive type styles. Do not use the expressive
styles (`cds--type-expressive-*`). Those belong to marketing surfaces; this is a tool.

**The Label-Not-Heading Rule.** KPI tiles carry a large number (Display weight) and a small label
(Label style). The number leads; the label identifies. The hierarchy is never inverted to make
a label appear more prominent than its value.

## 4. Elevation

The system is tonal: surfaces are differentiated by Gray scale steps, not by drop shadows. Depth
is structural (what layer is this content on?) not decorative (what should feel important?). No
box-shadow values exist in the codebase; this is deliberate.

Three tonal levels in g90:

1. **Base** (#262626): The page surface itself.
2. **Raised** (#393939, +1 Gray step): Tiles, form fields, table bodies. The primary content
   surface.
3. **Elevated** (#525252, +2 Gray steps): Nested elements within a Raised container. Active row
   highlight, border lines, second-order containers.

Modals do not use shadow for elevation; Carbon's standard backdrop scrim provides the separation.

### Named Rules
**The Tonal Depth Rule.** When a surface needs to feel above its parent, shift one Gray step
lighter. Never introduce a drop shadow to achieve this. If the step shift does not communicate
the hierarchy, the layout needs restructuring, not a shadow.

**The No-Shadow Rule.** Drop shadows are prohibited. They belong to a different aesthetic register
(consumer apps, material-lifted UI). This system reads depth through tone alone.

## 5. Components

### Buttons
Structured confidence: buttons feel solid and load-bearing. Hover states shift one palette step.
No lift, no grow animation. Zero border-radius throughout.

- **Shape:** Square (0 radius). No rounding on any button variant.
- **Primary:** Signal Blue (#4589ff) background, Lunar White text, 15px left padding. Used for
  additive actions (Add Transaction, Import CSV).
- **Primary hover:** Blue 60 (#0062fe). Crisp step shift; no transition on layout properties.
- **Ghost:** Transparent background, Signal Blue text. Used for secondary or equal-weight actions
  (Export CSV, Cancel). Same padding rhythm as primary.
- **Danger:** Alert Red (#ff8389) background, Graphite Base text. Used only for destructive
  actions (Delete, Reset Data). Always preceded by a confirmation step.
- **Focus:** Carbon's 2px focus ring in `--cds-focus` (white in g90), inset via
  `--cds-focus-inset`. Applies without exception to all interactive elements.

### DataTable
The dominant data surface. Transaction lists with sorting, batch selection, and overflow actions.

- **Background:** Graphite Raised (#393939, `--cds-layer-01`).
- **Row hover:** Graphite Elevated (#525252) tint. No animation.
- **Header row:** Graphite Base (#262626) background, Ash Grey column labels in Label type style.
- **Selected row:** Carbon's `--cds-layer-selected-01` tint.
- **Overflow menu:** Three-dot in Ash Grey at rest, Lunar White on hover.
- **Income rows:** Growth Green Tag with ArrowUp icon. Expense rows: Alert Red Tag with ArrowDown
  icon. Color is never the only channel; the icon is not optional.
- **Batch actions:** Appear on row selection. Danger styling on Delete batch action.

### Tiles
The primary content grouping surface. Used for KPI display, settings sections, and empty states.

- **Corner style:** Square (0 radius).
- **Background:** Graphite Raised (#393939).
- **Shadow:** None.
- **Border:** None at rest.
- **Internal padding:** 16px (`--cds-spacing-05`) standard. 32px (`--cds-spacing-07`) in empty
  states to give pictograms room.
- **KPI Tile:** Uses `<ClickableTile>` with a Display-weight number, Label-weight description
  below, and an optional secondary metric in Ash Grey. The number is the tile; no gradient
  accent, no decorative background, no hero-metric chrome.

### Inputs and Fields
Flat and functional. The field boundary is the affordance; no decorative chrome.

- **Style:** Graphite Raised (#393939) background, Lunar White text, Carbon's bottom-border-only
  appearance at rest (no full-perimeter border in the default g90 presentation).
- **Focus:** 2px Signal Blue border (full perimeter). Immediate on focus; no delay.
- **Error:** Alert Red bottom border, `--cds-text-error` message below with error icon in the
  label row.
- **Disabled:** Smoke Grey text, reduced-opacity background.
- **NumberInput:** Stepper controls (+ / −) rendered as Ghost-style inline buttons.

### Navigation
SideNav in rail mode: 48px wide collapsed, 256px expanded.

- **Rail:** Icon-only when collapsed. Expand on toggle or hover reveals Label-weight text.
- **Active item:** Signal Blue 1px left indicator (Carbon default) and lightened background tint.
- **Inactive item:** Smoke Grey icon, Ash Grey text.
- **Hover:** Graphite Elevated background tint. No transition on width; expand is mechanical.
- **Header:** Fixed 48px top bar. "Flow**state**" in HeaderName (bold on "state" only). Right
  side: Currency switcher, Theme cycle, Settings link.

### Charts
Carbon Charts exclusively. Two chart types in active use.

- **CashFlowComboChart:** Grouped bar (Income, Expense) with Net Flow line overlay. Carbon
  data-vis palette positions 1, 2, 3. Theme prop synchronized with the app theme cookie.
- **ProjectionLineChart:** Three scenario lines (15%, 17.5%, 20% annual growth). Same data-vis
  palette. X-axis is years 0-30; Y-axis is portfolio value in the display currency.
- **Never** use custom D3 or custom colors for chart series. If Carbon Charts cannot express a
  visualization, raise the question before reaching for D3.

### Tags
Pill-shaped semantic labels for transaction categories and status indicators only.

- **Style:** Transparent background, colored text, pill radius (9999px). Always color and icon
  together.
- **Income:** Growth Green (#42be65) text, ArrowUp icon.
- **Expense:** Alert Red (#ff8389) text, ArrowDown icon.
- **Never** use color alone on a tag; the icon is mandatory.

## 6. Do's and Don'ts

### Do:
- **Do** use `--cds-*` CSS custom properties for every color, spacing, and type value. The token
  is the API; the hex value in this document is documentation only.
- **Do** pair every status color with an icon or glyph. Expense amounts in red need an ArrowDown
  or minus sign. Error messages need a Warning icon. Color is never the sole channel.
- **Do** use `<Tag renderIcon={...}>` for any categorical or status label. A colored dot alone is
  not accessible and not on-brand.
- **Do** use Carbon's productive type scale. `cds--type-productive-heading-04` for page headings,
  `cds--type-label-01` for all helper text and sublabels.
- **Do** lay out every page with Carbon Grid (`<Grid>` + `<Column>`). Use native flex/grid only
  inside a single component's internal layout.
- **Do** use `<InlineNotification kind="warning">` for FX unavailability and data gap warnings.
  The kind prop carries the semantic weight; the copy states the specific condition.
- **Do** use `<ComposedModal>` for multi-field forms. Use `<Modal>` for single-decision
  confirmations (delete, reset).
- **Do** give empty states a Carbon pictogram, a short heading, and one primary CTA. No
  explanatory paragraphs, no illustrated characters, no motivational copy.

### Don't:
- **Don't** hardcode any hex value in source code. `color: #262626` or `background: #4589ff`
  will break in the white theme. Every value goes through `var(--cds-*)`.
- **Don't** use drop shadows. Depth is tonal. Shadows belong to a different aesthetic register.
- **Don't** design like retail fintech (Mint, YNAB, Copilot). No consumer-warm pastels, no
  motivational copy, no gamification badges, no progress streaks, no friendly illustrations.
  Flowstate is not encouraging anyone.
- **Don't** design like a crypto dashboard. No neon on black, no candlestick overload, no
  ticker-tape anxiety. Flowstate is about patient compounding, not speculation.
- **Don't** use the hero-metric template: big number, small label, supporting stats, gradient
  accent. The number is the tile; it needs no decoration.
- **Don't** build identical card grids (icon + heading + body text, repeated). That is the SaaS
  analytics anti-reference. If you find yourself writing that pattern, stop and reconsider the
  information architecture.
- **Don't** use `border-left` greater than 1px as a colored accent stripe on any card, list item,
  callout, or alert. Rewrite with a background tint, full border, or leading icon.
- **Don't** use gradient text. No `background-clip: text` with a gradient background. Emphasis
  through weight or size, never through gradient.
- **Don't** import shadcn, Radix, Material-UI, or Tailwind. Carbon ships everything this product
  needs. If it seems like Carbon lacks something, check `docs/05_design_system_spec.md` § 3 first.
- **Don't** call `localStorage` directly from UI code. All persistence goes through the
  Repository interfaces in `src/lib/`. Direct `localStorage` calls in components are an
  architecture violation.
- **Don't** put the Finnhub API key in client-readable code. It belongs in user Settings
  (LocalStorage via Repository) or `process.env` (server-only route handlers). Never in source.
- **Don't** mistake Bloomberg terminal density for seriousness. Information overload, monospace
  everything, zero breathing room signals complexity. Density serves comprehension;
  comprehension is the goal.
