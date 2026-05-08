# ADR 007 — Adopt impeccable as a Carbon-paired design skill

## Context

`carbon-builder` enforces *what to use*: token before value, component before markup, theme over palette, Carbon Charts first. What it does not enforce is *how to use it well* — composition, visual hierarchy, the weight relationship between elements, or the difference between a page that passes every audit item and one that looks like generic SaaS analytics.

The Settings page shipped in Session 21 is the load-bearing evidence. Every Carbon component was used correctly: token-sourced colors, correct component variants, no raw hex, all four themes functional. Yet the result was compositionally broken — five undifferentiated tiles with identical visual weight, helper text floating loose on disabled controls, the danger Reset button orphaned without preparatory copy, and tile boundaries invisible on g100. `carbon-builder` could not catch this because none of it was a Carbon-rule violation. The gap is real and reproducible whenever a page is built by completing the component and token checklist without a separate hierarchy pass.

Alternatives considered and rejected:

- **`frontend-design`** (first-party Anthropic) — examined; its "Frontend Aesthetics Guidelines" prescribe custom fonts, asymmetric layouts, atmospheric effects (gradient meshes, noise, grain, custom cursors). These are incompatible with Carbon's component-first, token-first discipline. No "suppress if a design system is in use" toggle exists, so the skill router would compete with `carbon-builder` and `impeccable` on every UI task.
- **Authoring a Flowstate-specific design-care skill from scratch** — drafted, then dropped. Would have duplicated impeccable's seven reference files (typography, color-and-contrast, spatial-design, motion-design, interaction-design, responsive-design, ux-writing) at lower quality.

## Decision

Adopt **impeccable** (`pbakaus/impeccable`) as a Carbon-paired design skill. Vendored verbatim into `.claude/skills/impeccable/` after running `bun run build:skills` (the README's `cp -r dist/...` instruction misleadingly assumes pre-populated build output that is `.gitignore`'d; the build step is required first and is not documented in the install section — upstream doc issue).

Configured via two wizard runs in Session 24:

- **`/impeccable teach`** → `PRODUCT.md` at repo root. Picks: product register, "Clear, honest, unhurried" personality (the 30-year horizon defines a contemplation tool, not a precision tool), all four anti-references (retail fintech, crypto dashboard, generic SaaS analytics, investment-bank terminal). The SaaS-analytics anti-reference directly targets the Settings-page failure mode.
- **`/impeccable document`** → `DESIGN.md` at repo root. Picks: "The Long Exposure" North Star, "Structured confidence" components, "Depth through tone, not shadow" elevation (Carbon's `background → layer-01 → layer-02` lightness steps). Wizard state persisted in `.impeccable/design.json` (tracked in git so contributors inherit the configuration without re-running the wizards).

`frontend-design` is **disabled at project scope** via `.claude/settings.json` so its skill router does not compete with `impeccable` + `carbon-builder` on UI tasks. User-level installs of `frontend-design` remain unaffected.

`carbon-builder` and `impeccable` compose: the former enforces *what to use*, the latter enforces *how to use it*. Both are invoked together for any non-trivial UI task. Validated end-to-end by Session 25's Settings polish (composition restructure, proportional spacing, disabled-affordance fix, g100 tile-boundary fix), which produced 0 must-fix findings on `/impeccable audit` while preserving full Carbon token discipline.

## Consequences

- **Two skills now invoked for UI work**, not one. Phase 3 (Simulation) prompts and beyond reference both `carbon-builder` and `impeccable`.
- **23 `/impeccable` slash commands available** — `audit`, `polish`, `critique`, `clarify`, `distill`, `harden`, `optimize`, etc. — for in-flight quality checks rather than only at PR review time.
- **`PRODUCT.md` and `DESIGN.md` are project-context source-of-truth artifacts**, sibling to `CLAUDE.md`. Added to "Required reading order" as items 0a and 0b in Session 25. Strategic and tactical framing is now durable, not living in prompts.
- **`frontend-design` disable scope is project-only.** The user's marketing and personal projects can still leverage it. If a Flowstate marketing landing page outside the app shell is ever built, re-enabling `frontend-design` for that subdirectory is a candidate — not yet relevant.
- **Vendored skill diverges from upstream over time.** When `pbakaus/impeccable` ships new free-tier features, manual reconcile is required. Mirrors the fallow-skill posture from ADR 006.
- **`.impeccable/design.json` is a tracked configuration artifact.** Future `/impeccable teach` or `/impeccable document` re-runs modify this file; treat as configuration, not generated output.
- **Maintenance posture:** when impeccable's reference files (typography.md, color-and-contrast.md, etc.) update upstream, evaluate whether to re-vendor or stay pinned.
