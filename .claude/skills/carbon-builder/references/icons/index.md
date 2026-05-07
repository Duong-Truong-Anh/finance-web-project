# Icons & Pictograms

Carbon ships two separate libraries: **icons** (functional) and **pictograms** (illustrative).

## @carbon/icons — functional

~2,000 SVG icons in four sizes: 16, 20, 24, 32. Available as React components (`@carbon/icons-react`), Vue components (`@carbon/icons-vue`), and raw SVG.

Browse the library at https://carbondesignsystem.com/elements/icons/library/ — every icon has a name and the search is good.

### React

```jsx
import { Add, Settings, UserAvatarFilled, ArrowRight, TrashCan,
         Information, WarningFilled, CheckmarkFilled, ErrorFilled } from '@carbon/icons-react';

<Add size={16} />
<Settings size={20} />
<ArrowRight size={24} />
<UserAvatarFilled size={32} />
```

### Web Components / vanilla

```js
// Side-effect import the size you need
import '@carbon/icons/lib/add/16.js';
import '@carbon/icons/lib/settings/20.js';
```

```html
<svg width="16" height="16">
  <use href="#carbon-add-16"></use>
</svg>
```

Or render the raw SVG inline:

```html
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" />
</svg>
```

### Sizes — pick by context

| Size | Use |
|---|---|
| 16 | Inline with body text, in buttons (default), in dense tables |
| 20 | Inline with body-02, in toolbars |
| 24 | Standalone interactive icon buttons, header navigation |
| 32 | Empty states, large CTAs, hero areas |

### Most-used icon names

If you remember a few names, you'll guess the rest. Carbon's naming is consistent.

**Actions**: `Add`, `Subtract`, `Close`, `Edit`, `Save`, `Copy`, `Paste`, `TrashCan`, `Download`, `Upload`, `Share`, `Print`, `Send`, `Search`, `Filter`, `Sort`, `Settings`, `Refresh`, `Renew`, `Reset`.

**Navigation**: `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `ChevronLeft`, `ChevronRight`, `ChevronUp`, `ChevronDown`, `CaretLeft`, `CaretRight`, `OverflowMenuVertical`, `OverflowMenuHorizontal`, `Menu`, `Home`.

**Status**: `Information`, `WarningFilled`, `WarningAltFilled`, `CheckmarkFilled`, `CheckmarkOutline`, `Checkmark`, `ErrorFilled`, `Error`, `InProgress`, `PendingFilled`, `Subtract`, `Help`.

**Communication**: `Email`, `Notification`, `NotificationFilled`, `Chat`, `ChatBot`, `Phone`.

**User**: `User`, `UserAvatar`, `UserAvatarFilled`, `UserMultiple`, `Group`, `IbmCloudPakIdentity`.

**Files & data**: `Document`, `Folder`, `FolderOpen`, `Attachment`, `Image`, `Video`, `Code`, `Csv`, `Pdf`, `Json`, `Xml`, `Database`, `DataTable`, `ChartLine`, `ChartBar`.

**Cloud / dev**: `Cloud`, `Server`, `Container`, `Kubernetes`, `Deploy`, `Git`, `Github`, `Branch`, `Tag`, `Workspace`.

**AI**: `MachineLearning`, `Ai`, `AiGenerate`, `AiResults`, `AiResultsFilled`, `Sparkle`, `WatsonHealth*` family.

**Suffixes** to know:
- `*Filled` — solid version (used for active/selected states)
- `*Outline` — outline version (default)
- `*Alt` — alternate variant (different visual treatment)
- `Caret*` vs `Chevron*` — caret is a triangle, chevron is an angle bracket

### Coloring icons

```jsx
{/* Inherit from text color */}
<Add />

{/* Explicit Carbon icon token */}
<Add style={{ fill: 'var(--cds-icon-primary)' }} />
<ErrorFilled style={{ fill: 'var(--cds-support-error)' }} />
<CheckmarkFilled style={{ fill: 'var(--cds-support-success)' }} />
<WarningFilled style={{ fill: 'var(--cds-support-warning)' }} />
<Information style={{ fill: 'var(--cds-support-info)' }} />
```

For interactive icons (icon buttons): rely on the component's built-in token wiring rather than setting fill directly.

### Accessible-name rules

- Decorative icon next to a text label: `aria-hidden="true"` (the label IS the accessible name).
- Icon-only interactive: must have an accessible name via `aria-label`, `aria-labelledby`, or `<title>` inside the SVG. Carbon's `<IconButton>` and `<Button hasIconOnly iconDescription="...">` handle this for you.

## @carbon/pictograms — illustrative

Larger, decorative SVGs for empty states, marketing pages, and onboarding screens. Distinct from icons:

| Icons | Pictograms |
|---|---|
| Functional, semantic | Decorative, illustrative |
| 16 / 20 / 24 / 32 px | 32 / 48 / 64 / 96+ px |
| Single color (currentColor / fill) | Multi-color, more detail |
| Used in buttons, toolbars, status | Used in empty states, onboarding, marketing |

Two flavors per pictogram:
- **Regular** — single-color, scalable
- **Color** (`*Color`) — multi-color illustration

```jsx
import { CarbonForIbmDotcom, Cloud, Database, AppDeveloper } from '@carbon/pictograms-react';

<Cloud width={64} />
<Database width={96} />
<AppDeveloper width={120} />
```

For Web Components / vanilla, import the SVG directly:

```js
import cloud from '@carbon/pictograms/svg/cloud.svg';
```

### When to use which

- Building an empty state? **Pictogram**.
- Building an onboarding screen with friendly illustrations? **Pictogram**.
- Building a marketing landing page section header? **Pictogram**.
- Putting an indicator next to a button? **Icon**.
- Putting an indicator in a table cell? **Icon**.
- Putting an indicator in a notification banner? **Icon**.

Mixing the two — using an icon where a pictogram belongs (or vice versa) — is one of the recognizable "this isn't really Carbon" tells.
