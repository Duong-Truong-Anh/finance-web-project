# Carbon component inventory (full)

This is the complete list of components Carbon ships, across all three flavors. Before re-implementing anything, check whether it's here.

## @carbon/react (126 components)

`AILabel`, `AISkeleton`, `Accordion`, `AccordionItem`, `AspectRatio`, `BadgeIndicator`, `Breadcrumb`, `BreadcrumbItem`, `Button`, `ButtonSet`, `ChatButton`, `Checkbox`, `CheckboxGroup`, `ClassPrefix`, `CodeSnippet`, `ComboBox`, `ComboButton`, `ComposedModal`, `ContainedList`, `ContentSwitcher`, `ContextMenu`, `Copy`, `CopyButton`, `DangerButton`, `DataTable`, `DataTableSkeleton`, `DatePicker`, `DatePickerInput`, `Dialog`, `Disclosure`, `Dropdown`, `ErrorBoundary`, `ExpandableSearch`, `FeatureFlags`, `FileUploader`, `FlexGrid`, `FluidComboBox`, `FluidDatePicker`, `FluidDatePickerInput`, `FluidDropdown`, `FluidForm`, `FluidMultiSelect`, `FluidNumberInput`, `FluidSearch`, `FluidSelect`, `FluidTextArea`, `FluidTextInput`, `FluidTimePicker`, `FluidTimePickerSelect`, `Form`, `FormGroup`, `FormItem`, `FormLabel`, `Grid`, `Heading`, `HideAtBreakpoint`, `Icon`, `IconButton`, `IconIndicator`, `Icons`, `IdPrefix`, `InlineCheckbox`, `InlineLoading`, `Layer`, `Layout`, `LayoutDirection`, `Link`, `ListBox`, `ListItem`, `Loading`, `Menu`, `MenuButton`, `Modal`, `ModalWrapper`, `MultiSelect`, `Notification`, `NumberInput`, `OrderedList`, `OverflowMenu`, `OverflowMenuItem`, `OverflowMenuV2`, `PageHeader`, `Pagination`, `PaginationNav`, `PasswordInput`, `Plex`, `Popover`, `Portal`, `PrimaryButton`, `ProgressBar`, `ProgressIndicator`, `RadioButton`, `RadioButtonGroup`, `RadioTile`, `Search`, `SecondaryButton`, `Select`, `SelectItem`, `SelectItemGroup`, `ShapeIndicator`, `SkeletonIcon`, `SkeletonPlaceholder`, `SkeletonText`, `Slider`, `Stack`, `StructuredList`, `Switch`, `Tab`, `TabContent`, `Tabs`, `Tag`, `Text`, `TextArea`, `TextInput`, `Theme`, `Tile`, `TileGroup`, `TimePicker`, `TimePickerSelect`, `Toggle`, `ToggleSmall`, `Toggletip`, `Tooltip`, `TreeView`, `UIShell`, `UnorderedList`.

Import path: `import { ComponentName } from '@carbon/react';`

## @carbon/web-components (83 components)

`accordion`, `ai-label`, `ai-skeleton`, `badge-indicator`, `breadcrumb`, `button`, `chat-button`, `checkbox`, `code-snippet`, `combo-box`, `combo-button`, `contained-list`, `content-switcher`, `copy`, `copy-button`, `data-table`, `date-picker`, `dialog`, `dropdown`, `feature-flags`, `file-uploader`, `floating-menu`, `fluid-dropdown`, `fluid-multi-select`, `fluid-number-input`, `fluid-password-input`, `fluid-search`, `fluid-select`, `fluid-text-input`, `fluid-textarea`, `fluid-time-picker`, `form`, `form-group`, `grid`, `heading`, `icon`, `icon-button`, `icon-indicator`, `inline-loading`, `layer`, `layout`, `link`, `list`, `loading`, `menu`, `menu-button`, `modal`, `multi-select`, `notification`, `number-input`, `overflow-menu`, `page-header`, `pagination`, `pagination-nav`, `password-input`, `popover`, `progress-bar`, `progress-indicator`, `radio-button`, `search`, `select`, `shape-indicator`, `side-panel`, `skeleton-icon`, `skeleton-placeholder`, `skeleton-text`, `skip-to-content`, `slider`, `slug`, `stack`, `structured-list`, `tabs`, `tag`, `tearsheet`, `text-input`, `textarea`, `tile`, `time-picker`, `toggle`, `toggle-tip`, `tooltip`, `tree-view`, `ui-shell`.

Use as `<cds-component-name>`. Import per-component: `import '@carbon/web-components/es/components/<name>/index.js';`

## @carbon/styles vanilla components

The Sass component modules: `accordion`, `ai-label`, `aspect-ratio`, `badge-indicator`, `breadcrumb`, `button`, `chat-button`, `checkbox`, `code-snippet`, `combo-box`, `combo-button`, `contained-list`, `content-switcher`, `copy-button`, `data-table` (with `action`, `expandable`, `skeleton`, `sort` sub-modules), `date-picker`, `dialog`, `dropdown`, `file-uploader`, `fluid-*` (combo-box, date-picker, dropdown, list-box, multiselect, number-input, search, select, text-area, text-input, time-picker), `form`, `icon-indicator`, `inline-loading`, `link`, `list`, `list-box`, `loading`, `menu-button`, `menu`, `modal`, `multiselect`, `notification`, `number-input`, `overflow-menu`, `page-header`, `pagination`, `pagination-nav`, `popover`, `progress-bar`, `progress-indicator`, `radio-button`, `search`, `select`, `shape-indicator`, `skeleton-styles`, `slider`, `slug`, `stack`, `structured-list`, `tabs`, `tag`, `text-area`, `text-input`, `tile`, `time-picker`, `toggletip`, `toggle`, `tooltip`, `treeview`, `ui-shell`.

Class API: `cds--<component>`, `cds--<component>__<element>`, `cds--<component>--<modifier>`.

## Notable cross-flavor differences

- **Side panel and Tearsheet** — exist as Web Components (`cds-side-panel`, `cds-tearsheet`) and in `@carbon/ibm-products` for React. Not in `@carbon/react` core.
- **Section / Heading auto-leveling** — React-only convenience.
- **AspectRatio, HideAtBreakpoint, Layout, LayoutDirection, Plex, Stack, ButtonSet, Switch, Toggletip** — React-only.
- **Skip to content** — `<SkipToContent>` (React, inside Header) vs `<cds-skip-to-content>` (WC, standalone) vs `.cds--skip-to-content` (vanilla).

## When you need a component beyond core

`@carbon/ibm-products` (separately published) adds higher-level patterns:

- `Tearsheet`, `TearsheetNarrow`
- `SidePanel`
- `PageHeader` (richer than the core variant)
- `EmptyState`
- `WebTerminal`
- `ProductiveCard`, `ExpressiveCard`
- `Toolbar`
- `CreateModal`, `CreateTearsheet`, `CreateSidePanel`
- `EditTearsheet`, `EditFullPage`
- `Datagrid` (extends `<DataTable>` with batch editing, virtualized rows, infinite scroll)
- `RemoveModal`
- and more

These are documented at `pages.github.ibm.com/cdai-design/pal/`.

`@carbon/charts` adds the data-viz library with React/Angular/Vue/Svelte/Vanilla wrappers.

`@carbon/ai-chat` adds the chat UI primitives.
