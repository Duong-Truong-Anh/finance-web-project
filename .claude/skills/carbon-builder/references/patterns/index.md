# Carbon patterns — quick reference

The named UX patterns Carbon documents. Each is a recipe for combining components.

| Pattern | When to reach for it | Key components |
|---|---|---|
| **Common actions** | Save/Cancel/Delete in dialogs and forms | Button (primary/secondary/danger) |
| **Dialog** | Focused interaction overlaid on the page | Modal, ComposedModal |
| **Disabled states** | Action exists but currently unavailable | (Token: text-disabled, icon-disabled, border-disabled, 25% opacity) |
| **Disclosure** | Progressive reveal of content | Accordion, ExpandableTile, Toggletip |
| **Empty states** | No data, error, or first-use | Tile/page + Pictogram + Heading + Body + Button |
| **Filtering** | Narrowing a result set | MultiSelect, SelectableTag, DismissibleTag |
| **Fluid styles** | Dense forms with collapsed labels | FluidTextInput, FluidDropdown, FluidNumberInput, etc. |
| **Forms** | Data entry | Form, FormGroup, Stack, Input components |
| **Global header** | Top-level product chrome | Header, HeaderName, HeaderNavigation, HeaderGlobalBar, SkipToContent |
| **Loading** | In-flight operations | ProgressBar (determinate), Loading (indeterminate), Skeleton (lazy) |
| **Login** | Authentication | Centered Tile + TextInput + PasswordInput + Button + Link |
| **Notification** | Status feedback | InlineNotification (banners), ToastNotification (transient), ActionableNotification |
| **Overflow content** | Long text, many actions | OverflowMenu, ellipsis with tooltip, expand row |
| **Read-only states** | Locked-but-visible values | Same components with `readOnly={true}` |
| **Search** | Find within a page | Search, ExpandableSearch |
| **Status indicator** | At-a-glance state | IconIndicator, ShapeIndicator (colorblind-safe), BadgeIndicator |
| **Text toolbar** | Rich-text editing | IconButton groups with dividers + tooltips |

## Common-actions specifics

- Primary on the right, secondary (Cancel) to its left.
- Order: `[Cancel] [Submit]` in LTR; reversed in RTL.
- Destructive primary: `kind="danger"`. Destructive secondary: `kind="danger--ghost"`.
- In Modal, the action buttons fill `<ModalFooter>` (full-height bar).
- For inline forms, action row sits below the form, left-aligned.
- Use `disabled` (rather than hide) for actions that exist but aren't currently valid.

## Dialog specifics

Modal sizes:
- `xs` (288px) — single short prompt or yes/no
- `sm` (480px) — small forms, simple confirmations with explanation
- `md` (672px) — most edit dialogs
- `lg` (1056px) — multi-column or content-heavy

Modal contract (Carbon `<Modal>` gives all of this for free):
- Traps focus inside while open
- Returns focus to trigger on close
- Escape closes (calls `onRequestClose`)
- Click-outside closes (unless `preventCloseOnClickOutside`)
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby`

For full-page non-blocking interactions → use Tearsheet (from `@carbon/ibm-products` or `cds-tearsheet`), not Modal.

## Empty states specifics

Three variants:
- **First-use** — show the user how to start
- **Error** — explain what went wrong, offer next step
- **No-results** — search/filter returned nothing — suggest changes

Always include: Pictogram (>= 64px), heading, body explaining the state, primary action. Don't use icons — they're too small.

## Forms specifics

- Vertical single-column layout is the default
- Group related fields with `<FormGroup legendText="...">`
- Required fields: asterisk + "Required" indicator (Carbon does this with `required` prop)
- Validation timing:
  - **Inline** for syntactic errors (after blur)
  - **On-submit summary** for cross-field errors
- `invalid` + `invalidText` for errors
- `warn` + `warnText` for non-blocking warnings
- `helperText` for guidance always shown
- Use `<Stack gap={5}>` (or higher) for vertical rhythm

## Loading specifics

- Determinate operation (file upload progress, batch job): `<ProgressBar value={42} max={100}>`
- Indeterminate operation (waiting on server): `<Loading>` (full-screen) or `<InlineLoading>` (inline)
- Lazy-loaded content waiting on data: skeletons (`<SkeletonText>`, `<DataTableSkeleton>`)
- Don't mix strategies on the same surface — pick one

## Login specifics

- Centered card on a layered background
- Logo at top, then form: email/username → password → primary "Sign in" → secondary "Forgot password?" link → register link if applicable
- Common branded variant: marketing-style left half with imagery; form on the right (used in IBM Cloud, IBM Quantum)

## Notification specifics

- **Inline** (`<InlineNotification>`) — sit in the page flow as banners; for persistent feedback related to nearby content
- **Toast** (`<ToastNotification>`) — float top-right (default) or bottom-right; auto-dismiss in 5-7s; for transient confirmation
- **Actionable** (`<ActionableNotification>`) — inline notification with a CTA button for "do this thing now"

High-contrast variant (default): solid colored background; for important / critical messages.
Low-contrast variant (`lowContrast`): subtle background tint; for routine messages.

One notification per state — don't stack identical errors.

## Status-indicator specifics

Three Carbon components, each with built-in colorblind safety:

- `<IconIndicator>` — icon + text label
- `<ShapeIndicator>` — colored shape + text label. The shapes themselves encode meaning (circle = healthy, triangle = warning, square = error, diamond = info)
- `<BadgeIndicator>` — small numeric count (notifications, unread items)

Always pair with text or aria-label. Never color/shape alone.
