# Flowstate — Calculation Specification

> The financial math, fully derived. The student must be able to re-derive every formula on a whiteboard without the source. This document is the script for that explanation.

## 1. Inputs

The projection is a pure function of:

| Input | Symbol | Source / Value |
|---|---|---|
| Transactions | `T` | `TransactionRepository.list()` |
| Asset allocation | `A` | Fixed per teacher's brief: `{ stocks: 0.50, savings: 0.10, cash: 0.10, gold: 0.10, usd: 0.10 }`. Sums to 1.00. |
| Display currency | `c_disp` | `Settings.displayCurrency` |
| FX snapshot | `fx` | `FxRateSnapshot` |
| Stock annual growth scenarios | `G_stocks` | Fixed: `{0.15, 0.175, 0.20}` (low / mid / high). |
| Non-stock annual growth rates | `g_savings`, `g_cash`, `g_gold`, `g_usd` | **Defaults pending teacher's reference documents:** `0.05`, `0.00`, `0.07`, `0.00`. Single rate each (no scenario variation). |
| Contribution horizon | `n_c` | Fixed: 60 months (5 years) |
| Total horizon | `n_t` | Fixed: 360 months (30 years) |

All other inputs (ticker selection, theme, currency labels) do not affect numbers — they only affect what gets shown.

> **Spec correction (post-Phase-1.W7 — teacher clarification 2026-05-10).** The earlier draft modeled a single asset class (stocks) with a user-controlled ratio `r ∈ [0.30, 0.50]`. The teacher's clarification mandates fixed allocation across five asset classes. The `r` input is replaced by the fixed allocation `A`. Stock-only scenarios (`G`) become `G_stocks`; new single-rate inputs are introduced for the four non-stock asset classes. The non-stock rate values above are sensible defaults — confirm against the teacher's reference documents before pinning unit-test expected values.

## 2. Net cash flow per month

Group transactions by `YearMonth = format(occurredOn, 'YYYY-MM')`. For each month `m` in the contribution window:

```
inflow(m)  = Σ convert(t.amount, c_disp, fx)  for all t ∈ T where t.kind = 'income'  ∧ ym(t) = m
outflow(m) = Σ convert(t.amount, c_disp, fx)  for all t ∈ T where t.kind = 'expense' ∧ ym(t) = m
netFlow(m) = inflow(m) − outflow(m)
```

`netFlow(m)` may be negative. The display table shows the negative value with the typographic minus glyph (`−`, U+2212) and Carbon's `support-error` token.

## 3. Monthly allocation & per-stock split

For each asset class `a ∈ {stocks, savings, cash, gold, usd}`:

```
monthlyContribution(m, a) = max(0, floor(netFlow(m) × A[a]))   // minor units
```

If `netFlow(m) < 0`, **no contribution is made for any asset class that month.** The user sees the full negative net flow but every asset's monthly contribution is zero. This matches the brief's intent: investment is funded *out of* surplus, not financed by debt.

For the stock portion, the contribution further splits across 5 user-selected tickers:

```
perStockInvestment(m) = floor(monthlyContribution(m, stocks) / 5)   // minor units
```

`floor` runs in minor units throughout. The dropped remainder is at most 4 minor units per month per asset (≤ 4×5 = 20 minor units total per month) — never larger than $0.20 cumulative per month, documented in the report.

Note that **the full net flow is allocated** (the five percentages sum to 1.00). There is no leftover that stays as cash outside the portfolio. This differs from the pre-Phase-1.W7 model where a 30–50% slider implied the rest stayed as uninvested cash; in the new model, "cash" is one of the five asset classes itself, holding 10% by mandate.

## 4. Phase 1 — contribution years (months 1 to 60)

The user's monthly contributions accrue for the full contribution horizon. Within Phase 1, the portfolio also compounds at the chosen growth rate.

For an annual rate `g`, the equivalent monthly rate is:

```
g_m = (1 + g)^(1/12) − 1
```

For `g = 0.15`, `g_m ≈ 0.011714917`.
For `g = 0.175`, `g_m ≈ 0.013529722`.
For `g = 0.20`, `g_m ≈ 0.015309521`.

> **Spec correction (post-Phase-0.2).** An earlier draft of this spec listed the 17.5% monthly rate as `0.013561968`. That was an arithmetic error. The correct value is `0.013529722`, verified against `(1.175)^(1/12) − 1`. The `monthlyRateFromAnnual` test in `src/lib/projection/rates.spec.ts` is the source of truth.

The future value of a single asset class `a` at the end of month `k` (where `1 ≤ k ≤ 60`), assuming each month's contribution is made at the start of the month and earns a full month of growth that same month, is:

```
V_a(k, g_a) = Σ_{m=1..k}  monthlyContribution(m, a) × (1 + g_a_m)^(k − m + 1)
```

Where `g_a` is the annual rate for asset `a` (for stocks, one of {0.15, 0.175, 0.20}; for non-stock, the single rate from §1) and `g_a_m = (1 + g_a)^(1/12) − 1` is the corresponding monthly rate. This is the standard future-value-of-a-varying-annuity formula applied per asset class. The "k − m + 1" exponent accounts for end-of-month-k valuation with start-of-month contribution.

At the end of Phase 1 (`k = 60`):

```
V_a_60(g_a) = V_a(60, g_a)
```

`V_a_60` is the value asset `a` carries into Phase 2.

## 5. Phase 2 — compounding-only years (months 61 to 360)

No new contributions to any asset. Each asset compounds independently for the remaining months:

```
V_a(k, g_a) = V_a_60(g_a) × (1 + g_a_m)^(k − 60)        for 60 < k ≤ 360
```

Equivalently in years:

```
V_a_yr(y, g_a) = V_a_60(g_a) × (1 + g_a)^(y − 5)        for y ≥ 5
```

## 6. Total portfolio + three-line projection — assignment compliance

The brief specifies "an average annual growth rate of **15%–20%** per year" applied to the stock portion. Flowstate honors this by computing all three stock scenarios simultaneously, summing each with the (constant-across-scenarios) non-stock projections:

```
V_total_low(k)  = V_stocks(k, 0.15)  + V_savings(k) + V_cash(k) + V_gold(k) + V_usd(k)
V_total_mid(k)  = V_stocks(k, 0.175) + V_savings(k) + V_cash(k) + V_gold(k) + V_usd(k)
V_total_high(k) = V_stocks(k, 0.20)  + V_savings(k) + V_cash(k) + V_gold(k) + V_usd(k)
```

The non-stock terms are identical across the three lines; the spread between low / mid / high is purely stock-driven. The Simulation page renders all three as a Carbon area chart for the total; per-asset breakdowns render as separate small charts or a stacked-bar view. Milestone Tiles read out all three total values per horizon, with optional per-asset drill-down.

The student's report explanation:

> "The brief gives a stock-growth range of 15–20% and an asset allocation of 50% stocks plus four other classes at 10% each. Picking a single stock-growth point would discard half the information the brief gave us. Showing all three total-portfolio scenarios gives the user a low / mid / high case driven by stock variation, while the non-stock asset projections add a stable foundation regardless of stock outcome."

## 7. Milestone snapshots

Three horizons × three scenarios = nine **total-portfolio** values plus an optional per-asset breakdown at each milestone:

| Horizon | Month index | Symbol (total) | Per-asset breakdown |
|---|---|---|---|
| 10 years | 120 | `M_yr10(g_stocks) = V_total(120, g_stocks)` | `V_stocks(120, g_stocks)`, `V_savings(120)`, `V_cash(120)`, `V_gold(120)`, `V_usd(120)` |
| 20 years | 240 | `M_yr20(g_stocks) = V_total(240, g_stocks)` | same shape, k=240 |
| 30 years | 360 | `M_yr30(g_stocks) = V_total(360, g_stocks)` | same shape, k=360 |

Per-ticker value at a stock milestone is `V_stocks(k, g_stocks) ÷ 5`, computed for display only, not stored.

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
- Asset allocation: stocks 50%, savings 10%, cash 10%, gold 10%, USD 10% (fixed).
- Stock growth scenarios: 15%, 17.5%, 20%.
- Non-stock rates (defaults — confirm against teacher's documents): savings 5%, cash 0%, gold 7%, USD 0%.

Step by step.

```
netFlow(m)                       = 18,000,000 − 12,500,000   = 5,500,000  (constant)

Per-asset monthly contributions (each = floor(netFlow × A[a])):
  monthlyContribution(m, stocks)   = floor(5,500,000 × 0.50)   = 2,750,000
  monthlyContribution(m, savings)  = floor(5,500,000 × 0.10)   =   550,000
  monthlyContribution(m, cash)     = floor(5,500,000 × 0.10)   =   550,000
  monthlyContribution(m, gold)     = floor(5,500,000 × 0.10)   =   550,000
  monthlyContribution(m, usd)      = floor(5,500,000 × 0.10)   =   550,000
  Total per month                                              = 5,500,000  (matches netFlow exactly — no remainder when ratios divide evenly)
  perStockInvestment(m)            = floor(2,750,000 ÷ 5)      =   550,000

Total contributed across all 5 assets, 60 months:
  totalContributed                 = 5,500,000 × 60            = 330,000,000

Phase-1 close-out (constant-payment annuity FV per asset):
  V_a_60(g_a) = monthlyContribution(a) × ((1 + g_a_m)^60 − 1) / g_a_m × (1 + g_a_m)

Stocks (three scenarios):
  V_stocks_60(0.15)   ≈  245,625,000   (≈ 1.49× stock contributed of 165,000,000)
  V_stocks_60(0.175)  ≈  259,000,000
  V_stocks_60(0.20)   ≈  273,000,000

Non-stock (single rate each, constant across stock scenarios):
  V_savings_60(0.05)  ≈   37,393,000
  V_cash_60(0.00)     =   33,000,000   (no growth — exact: 550,000 × 60)
  V_gold_60(0.07)     ≈   39,365,000
  V_usd_60(0.00)      =   33,000,000   (held flat in stored currency)

Total at end of Phase 1:
  V_total_low_60   ≈  245.6M + 37.4M + 33.0M + 39.4M + 33.0M  ≈  388,400,000
  V_total_mid_60   ≈  259.0M + 37.4M + 33.0M + 39.4M + 33.0M  ≈  401,800,000
  V_total_high_60  ≈  273.0M + 37.4M + 33.0M + 39.4M + 33.0M  ≈  415,800,000

Phase-2 compounding (k − 60 months from V_a_60, per asset):
  V_a(k, g_a) = V_a_60(g_a) × (1 + g_a)^((k − 60) / 12)

Per-scenario totals (stocks vary across low/mid/high; non-stocks contribute the same):

Yr10  (k = 120):
  Stocks:    V_low ≈ 245.6M × 1.15^5  ≈   494M    V_mid ≈ 259.0M × 1.175^5  ≈   582M    V_high ≈ 273.0M × 1.20^5  ≈   679M
  Savings:   ≈ 47.7M (37.4M × 1.05^5)
  Cash:      33.0M (no growth)
  Gold:      ≈ 55.2M (39.4M × 1.07^5)
  USD:       33.0M (held flat)
  Total Yr10 low ≈ 663M  /  mid ≈ 751M  /  high ≈ 848M

Yr20  (k = 240):  Total ≈ {  2,058M  /   2,825M  /   3,847M  }
Yr30  (k = 360):  Total ≈ {  6,925M  /  12,229M  /  21,303M  }   *(approximate; pin via implementation)*
```

The numerical magnitudes above are illustrative — the formulas in §3–§7 are the source of truth. The implementation reproduces them exactly using the new five-asset model, and the unit test in `src/lib/projection/compute-projection.spec.ts` pins the expected milestones to within ±1 minor unit on the worked-example inputs (refresh after Phase 3.1 ships; the old pinned values from Phase 2.1 are stocks-only and need to be replaced).

The worked example is also reproduced in [04_feature_spec.md](04_feature_spec.md) §4 (Simulation page) so the user-facing readout matches the math.

## 10. Edge cases

| Case | Behavior |
|---|---|
| User has < 60 months of data | Projection uses the months it has; missing months contribute 0 to every asset class. The Simulation page surfaces an `<InlineNotification kind="info">` ("You've entered N months. Future months are projected as zero contribution until you fill them in."). |
| User has > 60 months of data | Only the first 60 months count for contributions. Months 61+ display in the cash-flow table but do not feed Phase 1. The Simulation page documents this with a help-link icon. |
| `netFlow(m) < 0` | No contribution for month `m` to **any** asset class. The cash-flow table shows the negative net flow; the projection treats that month as `monthlyContribution(m, *) = 0`. |
| Allocation tampered with (programmatic) | The Zod schema enforces `allocation === ASSET_ALLOCATION` (deep equality). Defensive only; no UI surface allows allocation editing. |
| Tickers selected: 0..4 instead of 5 | The math still runs (stock allocation always divides by 5, brief-mandated). The Simulation page surfaces a warning Tile but does not block. |
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
