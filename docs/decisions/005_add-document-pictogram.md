# ADR 005 — AddDocument pictogram for Dashboard empty state

## Context

The feature spec §2.5 calls for a `TaskAdd` pictogram from `@carbon/pictograms-react` in the Dashboard empty state. When implementing Phase 2.2, `TaskAdd` was not found as an export in `@carbon/pictograms-react@11.100.0`. The installed version only exports `Multitask` as the closest task-adjacent pictogram, and `AddDocument` as a semantically close "add a record" option.

## Decision

Use `AddDocument` from `@carbon/pictograms-react`. It communicates "add a document/record" which maps clearly to the empty-state CTA ("Add your first income or expense"). It is less literal than `TaskAdd` but more accurate than `Multitask`.

## Consequences

- The rendered pictogram differs from the spec's `TaskAdd` name but is semantically equivalent.
- If a future version of `@carbon/pictograms-react` introduces `TaskAdd`, swap in a one-line change.
- Spec §2.5 should be updated to reference `AddDocument` as the canonical pictogram.
