# ADR 001 — Pivot to IBM Carbon Design System

**Date:** 2026-04-28
**Status:** Accepted
**Deciders:** Project owner (student) + AI implementation partner

## Context

This project went through three direction changes inside ten days:

1. **V1 (2026-04-20 to 2026-04-22).** A vanilla HTML/CSS/JS bento dashboard with GSAP animations, Finnhub live API, and a D3 dual-band growth chart. Worked. Lacked a coherent product identity.
2. **Flowstate v0 (2026-04-23 to 2026-04-27).** A full re-spec under a hand-built monochrome design system (no gradients, Fraunces/Outfit/JetBrains, anti-AI editorial layout), Astro 6 + React + Bun, with a pure-function projection engine and a Repository data abstraction. Phase 0 scaffold landed (ESLint boundaries, seeded RNG return model, Vitest). The visual layer was never implemented. The project was abandoned with the repo reset to a near-empty state.
3. **Flowstate v1 — this version (2026-04-28).** A revamp under IBM Carbon Design System. The architectural lessons from v0 (Repository pattern, pure projection function, integer minor-units money model, Zod-validated schemas) carry over. The design posture (monochrome, hand-built primitives, Fraunces) does not.

The trigger for the pivot was a recognition that the v0 design posture was costing more attention than it was returning. Hand-rolling primitives, fighting AI defaults to look "editorial," and maintaining a custom token system was time spent on identity work that the assignment did not reward and that was not differentiated enough to be portfolio-level. A coherent off-the-shelf design language ships faster, looks production-grade by default, and gives the student an interesting talking point during the demo ("I built this on Carbon, the same design system that powers IBM Cloud").

## Decision

Adopt IBM Carbon Design System as the entire design and component substrate for Flowstate v1. Specifically:

- **`@carbon/react`** for components.
- **`@carbon/styles`** for tokens via Sass + CSS custom properties.
- **`@carbon/charts-react`** for charts; **D3** only as a justified exception.
- **`@carbon/icons-react`** + **`@carbon/pictograms-react`** for iconography.
- **IBM Plex Sans / Serif / Mono** for typography.
- **g90 (dark productive)** as the default theme; toggleable to g100 and white.
- **Stock chromatic Carbon** — no monochrome override. IBM Blue for primary action, full `support-*` palette for status.
- **Next.js (App Router) + Bun** as the application substrate.
- **Repository abstraction** (carried over from v0) with a LocalStorage adapter for the MVP and a designed-for-future-sync seam for WorkOS-backed remote storage.
- **Three-line deterministic projection** at 15% / 17.5% / 20% (assignment-faithful; the v0 plan to use Monte Carlo with seeded RNG is dropped as scope creep).
- **Live ticker integration** via Finnhub through Next.js route handlers (key kept off the client).
- **Real FX conversion** via `open.er-api.com` (free, no key, daily-cached).

The previous design posture is fully retired. The previous CLAUDE.md is replaced; the previous AI-PROCESS-LOG is archived under `docs/archive/`.

## Alternatives considered

- **Stay on Flowstate v0 (hand-built monochrome).** Rejected: unfinished UI layer, time cost of building primitives is not justified by the assignment, and the visual style is harder to defend in a demo than a recognized industrial design system.
- **Material UI / Chakra / shadcn-ui.** Rejected: Carbon was the user's explicit choice. shadcn carries a default aesthetic that the user previously rejected as AI-generated. Material is heavier and less fashionable in 2026. Chakra is fine but offers no comparable industry-recognition story.
- **Carbon Web Components instead of Carbon React.** Rejected: less full-featured, more friction with Next.js's React-first ecosystem.
- **Single-line projection at 17.5%** instead of three lines. Rejected: discards information the brief explicitly gave us (the 15–20% range). The three-line read gives the report a low/mid/high case to discuss.
- **Monte Carlo simulation** carried over from v0. Rejected as scope creep — assignment is satisfied with deterministic, the UI surface is already substantial, and the student must be able to explain every line of math.

## Consequences

### Positive

- Faster path to a shippable, production-looking app. Most of the design work is "compose Carbon primitives in the right order."
- Built-in accessibility, theming, responsive behavior, motion, and a11y test coverage from the design system.
- Strong demo talking point: "Built on IBM's open-source design system, the same one used by IBM Cloud."
- Lower aesthetic risk: Carbon-styled output is hard to read as "AI-generated" because it has a recognizable house style.
- Future cross-currency, multi-theme, and multi-locale work is materially easier — those are first-class Carbon concerns.

### Negative

- Carbon's identity dominates Flowstate's. The product looks like an IBM tool. This is fine for the assignment; it would matter more if Flowstate were a real product.
- The hand-built tokens, primitives, and CSS Modules from v0 are discarded code — sunk cost.
- Next.js is heavier than the previous Astro stack. Cold-start dev server is slower; bundle size is larger. Acceptable for an assignment with no perf SLO.
- Carbon Charts is less customizable than D3. A handful of stretch-goal visualizations (Sankey, custom milestone overlays) require justified D3 escapes.
- Bun + Next + Carbon's Sass tooling is a slightly off-the-beaten-path combination. Expect occasional friction; document workarounds in `decisions/` ADRs as they appear.

### Implications captured in other documents

- **Working agreement.** `CLAUDE.md` rewritten under Carbon-native rules.
- **Design tokens.** `05_design_system_spec.md` defines the Carbon-token discipline; previous `tokens.css` is removed.
- **Repo map.** `02_data_model.md` keeps the `src/lib/` Repository pattern; `src/components/primitives/` from v0 is removed (Carbon ships primitives).
- **Process log.** `AI-PROCESS-LOG.md` is reset; v0's log archived to `docs/archive/AI-PROCESS-LOG-pre-carbon.md` for grading-record continuity.
