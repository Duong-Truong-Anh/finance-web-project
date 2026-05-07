# Carbon-builder fast-path cheatsheet

Read this first. If you need more depth, fall back to the per-topic files in this directory.

---

## The four hard rules (recap)

1. Token before value.
2. Component before markup.
3. Theme over palette.
4. Grid for page; flex/grid for component.

## Token quick-pick

| Need | Token |
|---|---|
| Page background | `var(--cds-background)` |
| Card / panel surface | `var(--cds-layer-01)` |
| Card-inside-card surface | `var(--cds-layer-02)` |
| Card-inside-card-inside-card | `var(--cds-layer-03)` |
| Input field background | `var(--cds-field-01)` (or `-02` / `-03` matching layer level) |
| Default text | `var(--cds-text-primary)` |
| Secondary text | `var(--cds-text-secondary)` |
| Helper / hint text | `var(--cds-text-helper)` |
| Error text | `var(--cds-text-error)` |
| Disabled text | `var(--cds-text-disabled)` |
| Inverse text (on dark surface in light theme) | `var(--cds-text-inverse)` |
| White text on filled button | `var(--cds-text-on-color)` |
| Link | `var(--cds-link-primary)` |
| Visited link | `var(--cds-link-visited)` |
| Default icon | `var(--cds-icon-primary)` |
| Subtle border | `var(--cds-border-subtle-01)` |
| Strong border (inputs) | `var(--cds-border-strong-01)` |
| Focus ring | `var(--cds-focus)` |
| Status: error | `var(--cds-support-error)` |
| Status: success | `var(--cds-support-success)` |
| Status: warning | `var(--cds-support-warning)` |
| Status: info | `var(--cds-support-info)` |
| Modal overlay | `var(--cds-overlay)` |
| IBM brand blue (palette) | `blue-60` (`#0f62fe`) |

## Spacing quick-pick

| Need | Token |
|---|---|
| 2px | `var(--cds-spacing-01)` |
| 4px | `var(--cds-spacing-02)` |
| 8px | `var(--cds-spacing-03)` |
| 12px | `var(--cds-spacing-04)` |
| 16px (default padding) | `var(--cds-spacing-05)` |
| 24px (default gap) | `var(--cds-spacing-06)` |
| 32px (section spacing) | `var(--cds-spacing-07)` |
| 40px (large) | `var(--cds-spacing-08)` |
| 48px | `var(--cds-spacing-09)` |
| 64px (page section) | `var(--cds-spacing-10)` |
| 80px+ | `--cds-spacing-11` / `-12` / `-13` |

If you need a value not in this table, snap to the nearest token. Don't invent.

## Grid quick-pick

```scss
@use '@carbon/layout';

@include layout.breakpoint('md') { /* >= 672px */ }
@include layout.breakpoint('lg') { /* >= 1056px */ }
@include layout.breakpoint('xlg'){ /* >= 1312px */ }
@include layout.breakpoint('max'){ /* >= 1584px */ }
```

```jsx
<Grid>
  <Column sm={4} md={4} lg={8}>...</Column>
  <Column sm={0} md={4} lg={8}>...</Column>
</Grid>
```

## Type quick-pick

```scss
@use '@carbon/type';

.h1   { @include type.type-style('heading-05'); }
.h2   { @include type.type-style('heading-04'); }
.h3   { @include type.type-style('heading-03'); }
.body { @include type.type-style('body-01'); }
.label{ @include type.type-style('label-01'); }
.help { @include type.type-style('helper-text-01'); }
.code { @include type.type-style('code-01'); }
```

For React, you can also use the `<Heading>` component inside `<Section>` — it auto-picks the right `h1..h6`.

## Motion quick-pick

```css
.expand {
  transition: max-height 150ms cubic-bezier(0.2, 0, 0.38, 0.9); /* moderate-01 + standard.productive */
}
.fade-in {
  transition: opacity 110ms cubic-bezier(0, 0, 0.38, 0.9); /* fast-02 + entrance.productive */
}
.fade-out {
  transition: opacity 110ms cubic-bezier(0.2, 0, 1, 0.9); /* fast-02 + exit.productive */
}
@media (prefers-reduced-motion: reduce) {
  .expand, .fade-in, .fade-out { transition: none; }
}
```

## Component quick-pick

| You want | Use |
|---|---|
| A button | `<Button>` with `kind="primary|secondary|tertiary|ghost|danger|danger--ghost|danger--tertiary"` |
| Icon-only button | `<Button hasIconOnly renderIcon={Icon} iconDescription="...">` (or `<IconButton>`) |
| Text input | `<TextInput id="..." labelText="..." />` |
| Search box | `<Search>` |
| Number input | `<NumberInput>` |
| Textarea | `<TextArea>` |
| Password | `<TextInput.PasswordInput>` (or `<PasswordInput>`) |
| Radio group | `<RadioButtonGroup>` + `<RadioButton>` |
| Checkbox group | `<CheckboxGroup>` + `<Checkbox>` |
| On/off toggle | `<Toggle>` |
| Dropdown (no filter) | `<Dropdown>` |
| Dropdown (filterable) | `<ComboBox>` |
| Multi-select | `<MultiSelect>` or `<FilterableMultiSelect>` |
| Native HTML `<select>` | `<Select>` |
| Slider | `<Slider>` |
| Date | `<DatePicker>` + `<DatePickerInput>` |
| Time | `<TimePicker>` |
| File upload | `<FileUploader>` (or `<FileUploaderDropContainer>` for drag-drop) |
| Modal/dialog | `<Modal>` (convenience) or `<ComposedModal>` (full control) |
| Side panel | `@carbon/ibm-products` — `<SidePanel>` (not in `@carbon/react`) |
| Tooltip on hover | `<Tooltip>` |
| Click-revealed help | `<Toggletip>` |
| Tabs | `<Tabs>` + `<TabList>` + `<TabPanels>` + `<TabPanel>` |
| Accordion | `<Accordion>` + `<AccordionItem>` |
| Card-like surface | `<Tile>` (`<ClickableTile>`, `<ExpandableTile>`, `<SelectableTile>`, `<RadioTile>`) |
| Tag/chip | `<Tag>` (`<DismissibleTag>`, `<OperationalTag>`, `<SelectableTag>`) |
| Toast | `<ToastNotification>` |
| Inline banner | `<InlineNotification>` |
| Inline with action | `<ActionableNotification>` |
| Determinate progress | `<ProgressBar>` |
| Indeterminate progress | `<Loading>` or `<InlineLoading>` |
| Stepwise progress (wizard) | `<ProgressIndicator>` + `<ProgressStep>` |
| Skeleton placeholder | `<SkeletonText>`, `<SkeletonPlaceholder>`, `<SkeletonIcon>`, `<DataTableSkeleton>` |
| Kebab/overflow menu | `<OverflowMenu>` + `<OverflowMenuItem>` |
| Labeled menu button | `<MenuButton>` + `<MenuItem>` |
| Pagination | `<Pagination>` (with totals) or `<PaginationNav>` (simple) |
| Breadcrumb | `<Breadcrumb>` + `<BreadcrumbItem>` |
| Tree | `<TreeView>` |
| Structured key/value list | `<StructuredList>` |
| Code snippet | `<CodeSnippet>` |
| Copy-to-clipboard | `<Copy>` or `<CopyButton>` |
| Vertical rhythm container | `<Stack>` |
| Theme wrapper | `<Theme theme="g100">` |
| Layer (for nested surfaces) | `<Layer>` |
| Global header | `<Header>`, `<HeaderName>`, `<HeaderNavigation>`, `<HeaderGlobalBar>`, `<HeaderGlobalAction>`, `<SkipToContent>` |
| Side nav | `<SideNav>`, `<SideNavItems>`, `<SideNavLink>`, `<SideNavMenu>` |
| Page heading | `<Heading>` inside `<Section>` |
| Empty state | Tile or full layout + `@carbon/pictograms` + `<Heading>` + body + `<Button>` |
| Data table | `<DataTable>` with render-prop API |

For Web Components: same names but `cds-` prefixed and kebab-cased (`<cds-button>`, `<cds-text-input>`, `<cds-modal>`, etc.). For Vanilla: `cds--btn`, `cds--text-input`, `cds--modal` etc.

## Anti-pattern checklist

If you find any of these in your output, fix before delivering:

- [ ] No raw hex codes (`#xxxxxx`) — use tokens
- [ ] No raw `rgba()` — use `var(--cds-overlay)` or other token
- [ ] No arbitrary `Npx` for spacing — use spacing tokens
- [ ] No `@media (min-width: Npx)` — use `@include layout.breakpoint(...)`
- [ ] No raw `font-size`/`font-weight`/`line-height` — use type styles
- [ ] No `<button>` / `<input>` / `<select>` / `<dialog>` / `<a role="button">` for primitives — use Carbon components
- [ ] No `outline: none` without Carbon focus replacement
- [ ] No icon-only Button without `iconDescription` prop
- [ ] No color-as-only-state-signal — pair color with icon or text
- [ ] No custom `cubic-bezier` — use Carbon's eight easings
- [ ] No `prefers-color-scheme: dark` — use `<Theme theme="g100">`
- [ ] No mixing icon libraries — Carbon icons only

## When in doubt

1. Check `references/components/<name>.md` for component-specific guidance.
2. Check `references/patterns/<name>.md` for pattern-specific guidance.
3. If the official Carbon MCP is connected, use `code_search` for examples or `docs_search` for guidance.
4. If a real ambiguity remains, ask the user with a concrete options list — don't guess.
