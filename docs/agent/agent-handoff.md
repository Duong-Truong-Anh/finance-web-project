## meta
- write_status: complete
- status: in-progress
- last_updated: 2026-04-24T13:25:00+07:00
- session_summary: Completed Task 5 — Mulberry32 RNG, Box-Muller normals, lognormal return formula, and runProjection engine with 11 tests; 28/28 tests passing, lint and tsc clean, uncommitted.

## codebase_state
- Astro 6 + React islands + TypeScript (strictest) + Tailwind + Bun is scaffolded; dev server runs clean at localhost:4321.
- src/styles/tokens.css: 7-token warm monochrome palette (--canvas #F7F4EE → --ink-strong #0A0806), scoped under :root and [data-theme="light"]. Zero chromatic color.
- Fonts: Fraunces (serif), Outfit (sans), JetBrains Mono (mono) via Google Fonts CSS2.
- eslint.config.js: ESLint v10 flat config. Boundary rule on src/lib/**/*.{ts,tsx} blocks UI layer imports.
- vitest.config.ts: jsdom environment, targets src/**/__tests__/**/*.test.ts.
- src/lib/transactions/: Currency, Transaction, NewTransaction, TransactionPatch, TransactionFilters, CategoryDefinition, InvestmentPlan, StockDefinition, UserSettings — all with co-located Zod v4 schemas. Money is integer (smallest currency unit). Dates are ISO 8601 strings. TransactionRepository interface + RepositoryError (discriminated code: NOT_FOUND | INVALID | STORAGE_UNAVAILABLE) + LocalStorageTransactionRepository + runMigrations() stub + barrel index.ts. 13 Vitest tests all passing.
- src/lib/simulation/rng.ts: createRng(seed: string): Rng — djb2 hash → Mulberry32 PRNG, nextFloat() uniform [0,1), nextNormal() Box-Muller with cached second normal. Cache is part of RNG state; deterministic per seed.
- src/lib/simulation/returns.ts: lognormalMonthlyReturn(mu, sigma, Z) — pure formula with Itô correction (σ²/24 term). No RNG inside.
- src/lib/simulation/__tests__/rng.test.ts: 4 tests — RNG determinism (1000 draws), different seeds produce different values, Box-Muller N(0,1) statistics (10k draws, mean ∈ ±0.05, std ∈ 0.97–1.03), Itô correction (10k log-returns, mean and std within ±0.002/±0.003 of theoretical).
- src/lib/projection/engine.ts: MonthlyNetFlow, ProjectionInputs, MonthlySnapshot, ProjectionMilestone, ProjectionResult types + runProjection(inputs): ProjectionResult. 360-month output. Growth-before-contribution (end-of-period) convention. Float64 internally; rounds to integer per snapshot. Fallback net flow = avg of positive historical flows → expectedMonthlyNetFlow → 0.
- src/lib/projection/__tests__/engine.test.ts: 11 tests — determinism, different seeds, output shape (360 months, 3 milestones), zero ratio, negative flow month, contribution window < horizon, ratio = 100%, milestone alignment against months[], gains crossover correctness.
- bun run lint, bunx tsc --noEmit, bun run test all exit clean (28/28 tests). Task 5 changes not yet committed.
- Installed deps: zod@4.3.6, uuid@14.0.0 (runtime); vitest@4.1.5, jsdom@29.0.2 (dev). No Zustand, React Hook Form, D3, or Recharts yet.
- src/lib/csv/ and src/lib/currency/ directories exist but are empty — awaiting later phases.

## user_requests
1. Execute Task 5: seeded RNG + projection engine stub (plan covering RNG choice, normal distribution method, public API shape, file layout, test strategy, math ambiguities).

## actions_taken
1a. Read docs/02_prd.md (section 5.5 return model, stock parameters, determinism rule) and docs/03_feature_spec.md (Features 4.1, 4.4, 4.5, 8.1).
1b. Produced plan; user confirmed with one correction — use cached Box-Muller (standard implementation) instead of discarding the 6th normal.
1c. Created src/lib/simulation/rng.ts — djb2 hash, Mulberry32 state machine, cached Box-Muller nextNormal().
1d. Created src/lib/simulation/returns.ts — pure lognormalMonthlyReturn with Itô correction.
1e. Created src/lib/simulation/__tests__/rng.test.ts — 4 tests including Itô correction statistical validation.
1f. Created src/lib/projection/engine.ts — all projection types + full runProjection implementation.
1g. Created src/lib/projection/__tests__/engine.test.ts — 11 tests covering all plan test categories.
1h. Verified: lint ✓, tsc ✓, 28/28 tests ✓.

## files_touched
- created   src/lib/simulation/rng.ts
- created   src/lib/simulation/returns.ts
- created   src/lib/simulation/__tests__/rng.test.ts
- created   src/lib/projection/engine.ts
- created   src/lib/projection/__tests__/engine.test.ts
- read      src/lib/transactions/types.ts
- read      docs/02_prd.md
- read      docs/03_feature_spec.md
- read      docs/agent/agent-handoff.md

## key_decisions
- Mulberry32 over seedrandom: zero new dependencies; the statistical Itô test catches any implementation error.
- Box-Muller with cached second normal (standard implementation): deterministic call count without discards; cache is part of RNG object state so determinism is preserved across any call sequence.
- djb2 hash converts InvestmentPlan.seed (string) to uint32 for Mulberry32 — simple, no dep, deterministic.
- Growth applied before contribution each month (end-of-period convention) — consistent with standard finance simulation; documented in engine.ts.
- Stock values computed as float64 internally; rounded to nearest integer only in MonthlySnapshot output — prevents compounding rounding errors over 360 months while keeping the storage rule (integers) intact.
- Per-stock contribution = Math.round(totalContribution / 5); max discrepancy ≤ 4 units in smallest currency unit per month — acceptable.
- Fallback net flow for future months = average of positive historical flows; falls back to expectedMonthlyNetFlow; then zero — engine never divines a number from nothing.
- No barrel index.ts for simulation/ or projection/ yet — will add when Phase 1 imports them.
- RepositoryError is an exported class with a discriminated code field ('NOT_FOUND' | 'INVALID' | 'STORAGE_UNAVAILABLE') — lets UI code do structured error handling without string-matching.
- runMigrations() silently returns when localStorage is inaccessible (SSR/sandboxed contexts).
- Tokens scoped under :root AND [data-theme="light"] — post-MVP dark mode is one new CSS block, not a retrofit.

## open_threads
- [ ] Commit Task 5: stage and commit src/lib/simulation/ and src/lib/projection/ files.
- [ ] Phase 1: implement income/expense CRUD modals, transaction table, bar chart, empty states, category seeds, currency selection first-load modal (docs/03_feature_spec.md Jobs 1–3 + Feature 7.1). Read CLAUDE.md + feature spec sections before starting.

## handoff
- tone: concise — state understanding, flag ambiguity, propose plan, wait for confirmation, execute. No trailing summaries.
- first_action: Commit Task 5 (git status will show the 5 new files in src/lib/simulation/ and src/lib/projection/), then read docs/03_feature_spec.md Jobs 1–3 and Feature 7.1 before writing any Phase 1 code.
- external_blockers: none
- gotchas: Tailwind v4 @layer theme sets --font-serif/sans/mono defaults; our unlayered tokens.css overrides them — if fonts look wrong, check cascade order in DevTools before touching config. uuid@14 and zod@4 are major-version jumps from common tutorial examples — verify API with Bun -e smoke tests before writing code against unfamiliar methods. The projection engine's monthlyFlows are used positionally (index 0 = projection month 1), not by calendar date — the UI is responsible for ordering them chronologically before passing to runProjection.
