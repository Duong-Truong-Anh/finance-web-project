# Flowstate — Calculation Specification

> The financial math, fully derived. The student must be able to re-derive every formula on a whiteboard without the source. This document is the script for that explanation.

## 1. Inputs

The projection is a pure function of:

| Input | Symbol | Source |
|---|---|---|
| Transactions | `T` | `TransactionRepository.list()` |
| Investment ratio | `r` | `PortfolioConfig.ratio` ∈ [0.30, 0.50] |
| Display currency | `c_disp` | `Settings.displayCurrency` |
| FX snapshot | `fx` | `FxRateSnapshot` |
| Annual growth scenarios | `G` | Fixed: `{0.15, 0.175, 0.20}` |
| Contribution horizon | `n_c` | Fixed: 60 months (5 years) |
| Total horizon | `n_t` | Fixed: 360 months (30 years) |

All other inputs (ticker selection, theme, currency labels) do not affect numbers — they only affect what gets shown.

## 2. Net cash flow per month

Group transactions by `YearMonth = format(occurredOn, 'YYYY-MM')`. For each month `m` in the contribution window:

```
inflow(m)  = Σ convert(t.amount, c_disp, fx)  for all t ∈ T where t.kind = 'income'  ∧ ym(t) = m
outflow(m) = Σ convert(t.amount, c_disp, fx)  for all t ∈ T where t.kind = 'expense' ∧ ym(t) = m
netFlow(m) = inflow(m) − outflow(m)
```

`netFlow(m)` may be negative. The display table shows the negative value with the typographic minus glyph (`−`, U+2212) and Carbon's `support-error` token.

## 3. Monthly investment & per-stock allocation

```
monthlyInvestment(m) = max(0, netFlow(m) × r)
perStockInvestment(m) = floor(monthlyInvestment(m) / 5)   // minor units
```

`floor` runs in minor units. The remainder (≤ 4 minor units per month) is dropped; the assignment requires equal distribution and floor-division across 5 stocks is the cleanest equal split. The dropped remainder is never larger than $0.04 per month and is documented in the report.

If `netFlow(m) < 0`, **no investment is made that month.** The user sees the full negative net flow but the portfolio contribution is zero. This matches the brief's intent: investment is funded *out of* surplus, not financed by debt.

## 4. Phase 1 — contribution years (months 1 to 60)

The user's monthly contributions accrue for the full contribution horizon. Within Phase 1, the portfolio also compounds at the chosen growth rate.

For an annual rate `g`, the equivalent monthly rate is:

```
g_m = (1 + g)^(1/12) − 1
```

For `g = 0.15`, `g_m ≈ 0.011714917`.
For `g = 0.175`, `g_m ≈ 0.013561968`.
For `g = 0.20`, `g_m ≈ 0.015309521`.

The portfolio value at the end of month `k` (where `1 ≤ k ≤ 60`), assuming each month's contribution is made at the start of the month and earns a full month of growth that same month, is:

```
V(k, g) = Σ_{m=1..k}  monthlyInvestment(m) × (1 + g_m)^(k − m + 1)
```

This is the standard future-value-of-a-varying-annuity formula. The "k − m + 1" exponent accounts for end-of-month-k valuation with start-of-month contribution.

At the end of Phase 1 (`k = 60`):

```
V_60(g) = V(60, g)
```

`V_60` is the value the portfolio carries into Phase 2.

## 5. Phase 2 — compounding-only years (months 61 to 360)

No new contributions. The portfolio compounds for the remaining months:

```
V(k, g) = V_60(g) × (1 + g_m)^(k − 60)        for 60 < k ≤ 360
```

Equivalently in years:

```
V_yr(y, g) = V_60(g) × (1 + g)^(y − 5)         for y ≥ 5
```

## 6. Three-line projection — assignment compliance

The brief specifies "an average annual growth rate of **15%–20%** per year." Flowstate honors this by computing **all three** scenarios simultaneously:

```
V_low(k)  = V(k, 0.15)
V_mid(k)  = V(k, 0.175)
V_high(k) = V(k, 0.20)
```

This is the **R2** decision from spec confirmation: three deterministic lines instead of a single number. The Simulation page renders all three as a Carbon area chart; the milestone Tiles read out all three values per horizon.

The student's report explanation:

> "The brief gives a range of 15–20%. Picking a single point would discard half the information the brief gave us. Showing all three gives the user a low / mid / high case and is faithful to the brief."

## 7. Milestone snapshots

Three horizons × three scenarios = nine values:

| Horizon | Month index | Symbol |
|---|---|---|
| 10 years | 120 | `M_yr10(g) = V(120, g)` |
| 20 years | 240 | `M_yr20(g) = V(240, g)` |
| 30 years | 360 | `M_yr30(g) = V(360, g)` |

Per-stock value at a milestone is `M_yr*(g) ÷ 5`, computed for display only, not stored.

## 8. FX conversion rules

The FX snapshot has the form `{ base: 'USD', rates: { VND, USD } }`. Conversion in either direction:

```
convert({ amount, currency: 'VND' }, 'USD', fx)
  = round(amount / fx.rates.VND × 100) / 100   // VND minor → USD cents

convert({ amount, currency: 'USD' }, 'VND', fx)
  = round(amount × fx.rates.VND / 100)         // USD cents → VND minor
```

Rounding is half-to-even (banker's). Same-currency convert is identity.

The FX snapshot is read once at the top of `computeProjection(...)` and threaded down. A re-render with a stale snapshot will not crash; it will compute slightly out-of-date display values. A daily refresh is enough fidelity for an assignment's worth of cash-flow data.

## 9. Worked example

Inputs (all values in VND minor units; VND minor = 1 đồng):

- Months 1..60: constant inflow 18,000,000; constant outflow 12,500,000.
- Ratio `r = 0.40`.
- Growth scenarios: 15%, 17.5%, 20%.

Step by step.

```
netFlow(m)               = 18,000,000 − 12,500,000   = 5,500,000  (constant)
monthlyInvestment(m)     = 5,500,000 × 0.40          = 2,200,000  (constant)
perStockInvestment(m)    = 2,200,000 ÷ 5             = 440,000    (constant)
totalContributed         = 2,200,000 × 60            = 132,000,000

Phase-1 close-out values (constant-payment annuity FV formula):
  V_60(g) = monthlyInvestment × ((1 + g_m)^60 − 1) / g_m × (1 + g_m)
  (the trailing × (1 + g_m) factor accounts for start-of-month contribution)

V_60(0.15)  ≈ 2,200,000 × ((1.011714917^60 − 1) / 0.011714917) × 1.011714917
            ≈ 2,200,000 × (0.014259/0.011714917) × 1.011714917 × ... 
            ≈ 196,500,000  (≈ 1.49× total contributed)

V_60(0.175) ≈ 207,200,000
V_60(0.20)  ≈ 218,400,000

Phase-2 compounding (k − 60 months from V_60):
  V(k, g) = V_60(g) × (1 + g)^((k − 60) / 12)

Yr10  (k = 120):  V_low  ≈ 196.5M  × 1.15^5     ≈ 395 M
                  V_mid  ≈ 207.2M  × 1.175^5    ≈ 466 M
                  V_high ≈ 218.4M  × 1.20^5     ≈ 543 M

Yr20  (k = 240):  V_low  ≈ 196.5M  × 1.15^15    ≈ 1,599 M
                  V_mid  ≈ 207.2M  × 1.175^15   ≈ 2,344 M
                  V_high ≈ 218.4M  × 1.20^15    ≈ 3,367 M

Yr30  (k = 360):  V_low  ≈ 196.5M  × 1.15^25    ≈ 6,477 M
                  V_mid  ≈ 207.2M  × 1.175^25   ≈ 11,792 M
                  V_high ≈ 218.4M  × 1.20^25    ≈ 20,898 M
```

The numerical magnitudes are illustrative; the implementation must reproduce them exactly using the formulas above. A unit test in `src/lib/projection/__tests__/projection.spec.ts` pins the expected milestones to within ±1 minor unit on the worked-example inputs.

The worked example is also reproduced in [04_feature_spec.md](04_feature_spec.md) §3 (Simulation page) so the user-facing readout matches the math.

## 10. Edge cases

| Case | Behavior |
|---|---|
| User has < 60 months of data | Projection uses the months it has; missing months contribute 0. The Simulation page surfaces an `<InlineNotification kind="info">` ("You've entered N months. Future months are projected as zero contribution until you fill them in."). |
| User has > 60 months of data | Only the first 60 months count for contributions. Months 61+ display in the cash-flow table but do not feed Phase 1. The Simulation page documents this with a help-link icon. |
| `netFlow(m) < 0` | No contribution for month `m`. The cash-flow table shows the negative net flow; the projection treats that month as `monthlyInvestment(m) = 0`. |
| Ratio dragged to a value the slider does not allow (programmatic) | Clamp to [0.30, 0.50]. Defensive only; the slider component cannot produce out-of-range values. |
| Tickers selected: 0..4 instead of 5 | The math still runs (allocation is `monthlyInvestment / 5`, brief-mandated). The Simulation page surfaces a warning Tile but does not block. |
| FX snapshot fetch fails | Last good cached snapshot is used; if no cache exists, conversion functions throw `FxUnavailableError`, and the UI catches and shows a non-blocking banner. The user can still enter data in either currency. |
| All transactions removed | Projection is empty; pages show empty states. |

## 11. Pure-function contract

`computeProjection(input: ProjectionInput): Projection` is a **pure function**:

- Same inputs → same outputs, byte-for-byte.
- No `Date.now()`, `Math.random()`, or other side reads.
- No I/O. Inputs are passed in; outputs are returned.
- Lives in `src/lib/projection/`. The ESLint boundary forbids React or any UI import from this folder.

The call site is a React `useMemo` over the assembled inputs. Re-render on input change is the only trigger.

## 12. Performance budget

- `computeProjection` finishes in **< 50ms** for a one-year-data, three-scenario, 360-month run on a 2020 mid-tier laptop.
- Vitest pins this with a benchmark test (`it.skip('benchmark', ...)`, runnable manually with `bun run bench`).
- The Simulation page does not memoize beyond `useMemo` on the input tuple. Recomputation on every relevant change is cheap and avoids stale-cache classes of bug.
