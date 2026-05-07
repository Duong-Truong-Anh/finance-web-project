# Modal

The dialog primitive. Two APIs:

- `<Modal>` — convenience: heading + body + two-button footer in one component.
- `<ComposedModal>` — granular: assemble `<ModalHeader>`, `<ModalBody>`, `<ModalFooter>` yourself.

Use `<Modal>` for routine confirmations and quick edit dialogs. Use `<ComposedModal>` when you need custom footer composition or scroll behavior.

## React — convenience API

```jsx
import { Modal } from '@carbon/react';

<Modal
  open={isOpen}
  onRequestClose={() => setIsOpen(false)}
  onRequestSubmit={handleSubmit}
  modalHeading="Delete database?"
  modalLabel="Account resources"
  primaryButtonText="Delete"
  secondaryButtonText="Cancel"
  danger
  size="sm"
  preventCloseOnClickOutside={false}>
  <p>This action cannot be undone. The database and all of its contents will be permanently removed.</p>
</Modal>
```

### Key props

- `open` (bool) — controlled open state
- `onRequestClose` — called when close X is clicked, escape pressed, or backdrop clicked (unless prevented)
- `onRequestSubmit` — called when primary button is clicked
- `modalHeading` (string) — H3 inside the dialog
- `modalLabel` (string) — small label above the heading (optional)
- `primaryButtonText` / `secondaryButtonText`
- `danger` (bool) — primary becomes red, hover bright-red
- `passiveModal` (bool) — no buttons, only the X
- `size` — `xs` (288px) | `sm` (480px) | `md` (672px) | `lg` (1056px)
- `preventCloseOnClickOutside` (bool) — prevent backdrop close
- `selectorPrimaryFocus` — CSS selector for which element should receive focus on open (default: primary button or first focusable)
- `primaryButtonDisabled` — disable submit while form invalid

## React — composed API

```jsx
import { ComposedModal, ModalHeader, ModalBody, ModalFooter, TextInput, Stack } from '@carbon/react';

<ComposedModal open={isOpen} onClose={() => setIsOpen(false)} size="md">
  <ModalHeader title="Edit account" label="Settings" />
  <ModalBody hasForm>
    <Stack gap={5}>
      <TextInput id="name" labelText="Name" />
      <TextInput id="email" labelText="Email" />
    </Stack>
  </ModalBody>
  <ModalFooter
    primaryButtonText="Save"
    secondaryButtonText="Cancel"
    onRequestSubmit={handleSubmit}
  />
</ComposedModal>
```

`<ModalBody hasForm>` adds the bottom-padding adjustment so the form fields don't sit too close to the footer.

## Web Components

```html
<cds-modal id="my-modal" size="md">
  <cds-modal-header>
    <cds-modal-label>Account resources</cds-modal-label>
    <cds-modal-heading>Delete database?</cds-modal-heading>
  </cds-modal-header>
  <cds-modal-body>
    This action cannot be undone.
  </cds-modal-body>
  <cds-modal-footer>
    <cds-modal-footer-button kind="secondary" data-modal-close>Cancel</cds-modal-footer-button>
    <cds-modal-footer-button kind="danger">Delete</cds-modal-footer-button>
  </cds-modal-footer>
</cds-modal>

<script>
  // Open the modal
  document.querySelector('#my-modal').open = true;

  // Listen for close
  document.querySelector('#my-modal').addEventListener('cds-modal-closed', (e) => {
    console.log('closed', e.detail.triggeredBy);
  });
</script>
```

The `data-modal-close` attribute on a footer button wires up auto-close.

## Vanilla

```html
<div class="cds--modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="cds--modal-container cds--modal-container--md">
    <div class="cds--modal-header">
      <p class="cds--modal-header__label">Account resources</p>
      <h2 class="cds--modal-header__heading" id="modal-title">Delete database?</h2>
      <button class="cds--modal-close" type="button" aria-label="Close">
        <svg class="cds--modal-close__icon">...</svg>
      </button>
    </div>
    <div class="cds--modal-content">
      <p>This action cannot be undone.</p>
    </div>
    <div class="cds--modal-footer">
      <button class="cds--btn cds--btn--secondary">Cancel</button>
      <button class="cds--btn cds--btn--danger">Delete</button>
    </div>
  </div>
</div>
```

Open/close state managed via class `cds--modal--is-open` on the root.

## Sizing guidance

- `xs` (288px) — single short prompt or yes/no confirmations
- `sm` (480px) — small forms, simple confirmations with explanation
- `md` (672px) — most edit dialogs
- `lg` (1056px) — multi-column forms, content-heavy dialogs

If you need full-page interaction → use a Tearsheet (from `@carbon/ibm-products` or `cds-tearsheet`), not a modal.

## Behavior contract

A correctly-used Modal:

1. Traps focus inside while open. Cannot Tab out.
2. Returns focus to the trigger element when closed.
3. Escape key closes (calls `onRequestClose`).
4. Click-outside closes by default (unless `preventCloseOnClickOutside`).
5. Has `role="dialog"` and `aria-modal="true"` (built in).
6. Has accessible heading via `aria-labelledby`.
7. Body content is scrollable if it overflows; header and footer stay fixed.

Carbon's `<Modal>` and `<ComposedModal>` give all this for free. Hand-rolled modals usually get one of these wrong.

## Anti-patterns

- ❌ Using a Modal for navigation (modals interrupt — use a route).
- ❌ Stacking modals (open a modal from a modal).
- ❌ Nesting forms across body and footer — body should hold the form fields, footer holds the action buttons that submit it.
- ❌ Skipping `onRequestClose` — Escape and the X close button will fire it; if you don't handle it, your modal is broken.
- ❌ Missing `selectorPrimaryFocus` for forms — without it, focus may land on Cancel.
