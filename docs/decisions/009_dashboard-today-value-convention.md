# ADR 009 — Dashboard "today's value" reads `series[offset + 1]`

## Context

The Dashboard's three "Today's value" tiles (low / mid / high) rendered **$0.00**
whenever the user's data started in the current calendar month — the symptom in a
reported screenshot, sitting next to a non-zero "Contributed" tile.

An out-of-pipeline correctness audit (Fable 5, branch `audit/fable-projection`)
**exonerated the projection engine**: it proved 12 invariants including compounding
cadence, the month 1–60 window, and exact `byAsset` sums at all 361 points. In
particular it confirmed that `series[k]` is the value at the **end of month k**, that
**month 1 is the anchor (earliest-transaction) month**, and that **`series[0]` is always
exactly 0 by construction**. The defect was localized to a Dashboard selector.

`currentMonthIndex(transactions, today)` returns the count of elapsed months since the
anchor — `0` when today falls in the anchor month. The Dashboard fed that value
directly into `series[safeMonthIndex]`. So for the common "I just started this month"
case, `monthIndex = 0` → `series[0]` → **$0.00**.

Feature-spec §3 defines the tile as "Portfolio value at the current month, mid scenario"
but is ambiguous about which series index expresses that. Two readings exist:

- `offset` — end of the *previous* month (the value before this month's contribution
  has compounded a full month).
- `offset + 1` — end of the *current* month (this month's contribution invested at the
  start of the month per §4's annuity-due timing, valued at month end).

## Decision

**Use `series[offset + 1]`**, clamped to the engine's `[0, 360]` window:

```ts
const safeMonthIndex = Math.min(360, (monthIndex ?? 0) + 1);
```

This is consistent with the §4 annuity-due convention — a contribution is invested at
the start of its month and valued at the end of that month — so "the value at the
current month" is the end-of-current-month figure, `series[offset + 1]`.

No special tile state is built for a fully future-dated plan. **Accepted edge case:** a
plan whose earliest transaction is in a future month will show that first planned
month's value under the "Today" label. This is a rare, low-severity presentation seam,
not a correctness error, and is documented rather than handled (the Dashboard reframe in
Phase 3.5 is the right place to revisit it if it matters).

The coupled timezone seam is fixed at the same call site: `today` is normalized so its
local calendar date is carried in UTC fields, matching `currentMonthIndex`'s UTC getters
and the user-entered `occurredOn` calendar dates.

## Consequences

- The off-by-one is fixed **at the call site**. `currentMonthIndex` stays UTC-pure with
  its pinned tests intact; the projection engine is not touched (audit-confirmed correct,
  contract locked).
- The historical case (data starting months ago) now shows the **end-of-current-month**
  value instead of end-of-last-month — a small upward correction, intended.
- The future-dated-plan edge is a known, documented presentation seam, not a handled
  state. If it becomes user-visible noise, Phase 3.5 owns it.
- A regression e2e test (`e2e/dashboard.spec.ts`) seeds current-calendar-month
  transactions and asserts the "Today's value (mid)" tile is neither `$0.00` nor the
  `—` placeholder — the test that would have caught the original bug.
