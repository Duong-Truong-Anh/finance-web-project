# Button

The most-used component. Carbon Buttons come in seven kinds × six sizes. Icon-only buttons have a separate but related component (`<IconButton>`).

## Kinds

| Kind | When to use |
|---|---|
| `primary` | Principal action of a form/page. Only ONE primary in a primary group. |
| `secondary` | Action paired with primary (e.g., Cancel) |
| `tertiary` | Outline button — less prominent action |
| `ghost` | Text-only — actions in tables, toolbars |
| `danger` | Destructive principal action |
| `danger--tertiary` (React) / `danger-tertiary` (WC) | Outline danger |
| `danger--ghost` (React) / `danger-ghost` (WC) | Ghost danger |

## Sizes

`xs` (24px) · `sm` (32px) · `md` (40px, default) · `lg` (48px) · `xl` (64px, expressive) · `2xl` (80px, expressive)

## React

```jsx
import { Button, IconButton } from '@carbon/react';
import { Add, ArrowRight, TrashCan } from '@carbon/icons-react';

<Button>Save</Button>

<Button kind="secondary" size="lg">Cancel</Button>

<Button kind="tertiary" renderIcon={ArrowRight}>Continue</Button>

<Button kind="danger" disabled>Delete account</Button>

<Button as="a" href="/help" kind="ghost">Get help</Button>

{/* Icon-only Button via hasIconOnly */}
<Button
  hasIconOnly
  renderIcon={Add}
  iconDescription="Add row"
  tooltipPosition="top"
  tooltipAlignment="center"
  kind="ghost"
/>

{/* Or use IconButton directly */}
<IconButton label="Delete" kind="ghost">
  <TrashCan />
</IconButton>
```

### Important props

- `kind` (string) — see Kinds table above
- `size` (string) — see Sizes
- `disabled` (bool)
- `renderIcon` (Component) — icon to render alongside text (or in icon-only mode)
- `hasIconOnly` (bool) — turns Button into an icon-only button
- `iconDescription` (string) — **required** when `hasIconOnly` is true; provides accessible name
- `tooltipPosition` — `top` | `right` | `bottom` | `left` (icon-only only)
- `tooltipAlignment` — `start` | `center` | `end` (icon-only only)
- `as` — polymorphic; render as `a`, custom `Link`, etc. Common with Next.js, React Router.
- `href` — when present, Button renders as `<a>` (without needing `as="a"`)
- `isExpressive` (bool) — applies expressive type/spacing on lg
- `dangerDescription` (string) — additional message for screen readers on danger variants

## Web Components

```html
<cds-button>Save</cds-button>

<cds-button kind="secondary" size="lg">Cancel</cds-button>

<cds-button kind="tertiary">
  Continue
  <svg slot="icon" focusable="false" preserveAspectRatio="xMidYMid meet"
       width="16" height="16" viewBox="0 0 16 16">
    <!-- ArrowRight 16 -->
  </svg>
</cds-button>

<cds-button kind="danger" disabled>Delete</cds-button>

<cds-button kind="ghost" href="/help">Get help</cds-button>

<!-- Icon-only — separate element -->
<cds-icon-button kind="ghost" align="top">
  <svg slot="icon">...</svg>
  <span slot="tooltip-content">Add row</span>
</cds-icon-button>
```

WC kinds use single-dash separator: `danger-tertiary`, `danger-ghost` (React uses double-dash). The `danger-primary` value in WC is deprecated — use `kind="danger"`.

## Vanilla

```html
<button class="cds--btn cds--btn--primary" type="button">
  <span class="cds--btn__label">Save</span>
</button>

<button class="cds--btn cds--btn--secondary cds--btn--lg">
  <span class="cds--btn__label">Cancel</span>
</button>

<button class="cds--btn cds--btn--tertiary">
  <span class="cds--btn__label">Continue</span>
  <svg class="cds--btn__icon">...</svg>
</button>

<a class="cds--btn cds--btn--ghost" href="/help" role="button">
  <span class="cds--btn__label">Get help</span>
</a>
```

Modifier classes: `cds--btn--{primary,secondary,tertiary,ghost,danger,danger--tertiary,danger--ghost}`, `cds--btn--{xs,sm,md,lg,xl,2xl}`, `cds--btn--disabled`, `cds--btn--icon-only`, `cds--btn--expressive`.

## Common patterns

### Two-button form footer

```jsx
<div style={{ display: 'flex', gap: 'var(--cds-spacing-04)' }}>
  <Button kind="secondary" onClick={handleCancel}>Cancel</Button>
  <Button kind="primary" onClick={handleSubmit}>Save changes</Button>
</div>
```

The order is **always** Cancel-then-Submit (left-to-right). Reverse for RTL.

### Destructive confirmation

```jsx
<Modal
  modalHeading="Delete database?"
  primaryButtonText="Delete"
  secondaryButtonText="Cancel"
  danger>
  <p>This action cannot be undone.</p>
</Modal>
```

### Loading state on submit

```jsx
<Button disabled={isSubmitting}>
  {isSubmitting ? <InlineLoading description="Saving..." /> : 'Save'}
</Button>
```

## Anti-patterns to avoid

- ❌ Multiple `kind="primary"` buttons in the same group.
- ❌ Hand-rolled `<button>` with custom CSS — use `<Button>`.
- ❌ Icon-only Button missing `iconDescription`.
- ❌ `kind="danger"` for non-destructive actions (it should signal "irreversible bad consequence").
- ❌ Using `<Button>` for navigation — use `<Link>` or `<Button as="a" href=...>`.
- ❌ Custom focus styles (`:focus { outline: 2px solid red }`) overriding Carbon's blue focus ring.
