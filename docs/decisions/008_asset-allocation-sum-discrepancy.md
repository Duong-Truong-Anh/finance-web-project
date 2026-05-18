# ADR 008 — Five-asset allocation sums to 0.90, not 1.00

## Context

Phase 3.1 introduced the five-asset `AssetAllocation` type (`stocks`, `savings`, `cash`, `gold`, `usd`) to replace the single `ratio: number` field on `PortfolioConfig`. The teacher-mandated weights, sourced from the Phase 3.1 prompt and confirmed by `docs/decisions/` notes on the 2026-05-10 teacher clarification, are:

| Asset   | Weight |
|---------|--------|
| stocks  | 0.50   |
| savings | 0.10   |
| cash    | 0.10   |
| gold    | 0.10   |
| usd     | 0.10   |
| **sum** | **0.90** |

The allocation sums to **0.90**, not 1.00. This means 10% of each month's net flow is never attributed to any asset class and is not invested.

`docs/03_calculation_spec.md` §9 states the worked-example `totalContributed` as **330,000,000 VND** (based on 60 months × 5,500,000 net flow × 1.00 allocation). With a 0.90 sum the correct figure is **297,000,000 VND** (0.90 × 330,000,000). The spec number is inconsistent with the given weights.

This was discovered proactively during Phase 3.1 implementation when the worked-example pin test (written from the spec) diverged from the engine output.

## Decision

**Implement to the weights as given (0.90 sum); document the discrepancy; defer teacher resolution before Phase 3.2 ships any UI that displays `totalContributed`.**

Specifically:

1. `ASSET_ALLOCATION` is pinned to the exact values above (`as const satisfies AssetAllocation`).
2. Zod schema enforces each value as a `z.literal()`. Any persisted record with different values (including a hypothetical corrected allocation) fails validation and triggers the migration-to-default path.
3. `computeProjection` and all spec tests use **297,000,000** as the `totalContributed` worked-example pin, not 330,000,000.
4. The Session 31 log records the discrepancy under "Spec drift."
5. Phase 3.2 must not present `totalContributed` as "100% of contributions" in UI copy until the teacher confirms whether (a) the weights are correct and 10% is intentionally unallocated, or (b) one weight should be raised to make the sum 1.00.

## Consequences

- **Engine is correct relative to its inputs.** The projection math is internally consistent; the only ambiguity is what the weights should be, not how the math works.
- **Schema change required if teacher corrects the weights.** Changing any literal value in `assetAllocationSchema` is a breaking schema change — all persisted `PortfolioConfig` records with the old values will return `null` on `get()` and fall back to `DEFAULT_PORTFOLIO_CONFIG`. This is the same migration path that Phase 3.1 used for the old `ratio` field. Acceptable cost.
- **Spec §9 worked-example needs update.** When the teacher confirms the allocation sum, `docs/03_calculation_spec.md` §9 must be updated to reflect the correct `totalContributed` figure. This is a doc-only change with no code impact if the weights stay at 0.90.
- **Dashboard KPI "Contributed" tile is already live.** It displays `projection.scenarios[0].totalContributed`, which reflects the 0.90 sum. If the teacher corrects the allocation post-Phase-3.2, both the schema and the displayed figure will update automatically on next `portfolioRepository.get()` call (defaults kick in on parse failure).
