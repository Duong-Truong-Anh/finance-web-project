# ADR 004 — Adopt fallow for static analysis

## Context

ESLint (configured in `eslint.config.mjs`) already enforces one critical boundary: `src/lib/` files may not import `react`, `next`, or `@carbon/*` packages. That rule guards against UI leaking into the pure-logic layer. What it does **not** cover is:

- **Zone-to-zone import restrictions.** There is no machine-enforced rule preventing `src/lib/` from importing `src/features/`, or `src/components/` from importing `src/features/`. These constraints exist in `CLAUDE.md` as prose but have no automated check.
- **Dead code detection.** Unused files, exports, and types accumulate invisibly; the only current signal is TypeScript's `noUnusedLocals`, which only catches local variables.
- **Complexity hotspots.** No cyclomatic or cognitive complexity gate exists. Phase 2 introduces the projection engine where complexity discipline matters most.
- **Circular dependencies.** TypeScript resolves them silently; they create build-order fragility and test isolation problems.
- **Duplicate exports.** No guard exists against two modules exporting the same name into the same zone.

Alternatives considered: Knip (JS-only toolchain, no zone semantics), Dependency-Cruiser (graph-level, no dead-code or complexity), ESLint import-graph plugins (no complexity or duplication). Fallow covers all five concerns in a single Rust binary, ships on npm, is MIT-licensed, requires zero accounts, and exposes an Agent Skill that integrates with Claude Code without consuming permanent MCP context.

## Decision

Adopt fallow 2.66.0 as a dev dependency. Configuration is in `.fallowrc.json` at repo root.

**Zone schema** encodes Flowstate's layered architecture:
- `lib` (dependency leaf) may only import from `lib`.
- `components` may import from `lib` and `components`.
- `features` may import from `lib`, `components`, and `features`.
- `app` (composition root) may import from everything below.
- `tests` may import from anywhere (fixtures need cross-zone access).

This is a machine-checkable encoding of the architecture prose in `CLAUDE.md § Hard Rules → Architecture`.

**Rule posture:** `unresolved-imports`, `circular-dependencies`, and `duplicate-exports` are `error` (correctness signals — block the build). Unused-code and dependency warnings are `warn` against a saved baseline — new regressions are blocked, but the existing warning set is accepted-for-now and addressed in dedicated cleanup phases. Health thresholds are left at defaults (`maxCyclomatic: 20`, `maxCognitive: 15`, `maxCrap: 30`); tightening requires evidence from actual findings. `feature-flags` is set to `off` because Flowstate has no feature-flag framework (LaunchDarkly, Statsig, GrowthBook, etc.), and enabling it would produce false positives inside Carbon's internal conditional patterns.

**Skill route, not MCP.** The fallow Agent Skill is vendored into `.claude/skills/fallow/` (copied verbatim from `fallow-rs/fallow-skills` v1.0.0). Agent skills load on demand when a trigger phrase appears in a task prompt; MCP tool schemas live in context permanently and consume tokens on every request. For a static-analysis tool invoked occasionally rather than every turn, the skill route is lower cost.

ESLint is unchanged — the two layers are orthogonal. ESLint guards external package imports inside `src/lib/`; fallow guards zone-to-zone internal imports and adds dead-code, complexity, and duplication analysis.

## Consequences

- **New verification command:** `bun run fallow:check` (added to the verification table in `CLAUDE.md` and to `package.json` scripts). Must pass before any PR.
- **Baseline committed:** `.fallow/baseline.json` is tracked in git. Ratcheting (reducing the warning count) is a deliberate act requiring a dedicated cleanup phase — it does not happen automatically.
- **Agent skill auto-discovery:** Future implementer agents receive the `fallow` skill automatically when they ask about dead code, boundaries, or audit health. They do not need to be told "run fallow" explicitly.
- **Paid runtime-coverage tier not adopted.** `get_hot_paths`, `get_blast_radius`, `get_importance`, and `get_cleanup_candidates` are paid features. If flow-graph analysis is wanted later, it warrants a separate ADR.
- **MCP route not configured.** `fallow-mcp` binary is installed alongside the CLI by npm but is not registered in `.mcp.json`. If future sessions prefer the MCP route, it can be added without removing the skill.
- **Editor integration recommended but not enforced.** The fallow LSP (`fallow-lsp`) and VS Code extension provide inline feedback. Per-developer setup; not part of this ADR.
