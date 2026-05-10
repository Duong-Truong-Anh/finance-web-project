# Flowstate — Data Model

> Entities, money handling, validation, persistence, and the seam that lets the LocalStorage MVP grow into a real backend without a rewrite. This document is normative for `src/lib/`.

## 1. Entities

Five entities. Three persisted, two derived.

| Entity | Persisted? | Owner module |
|---|---|---|
| `Transaction` | yes | `src/lib/transactions/` |
| `PortfolioConfig` | yes | `src/lib/portfolio/` |
| `Settings` | yes | `src/lib/settings/` |
| `FxRateSnapshot` | yes (cache) | `src/lib/currency/` |
| `MonthlyAggregate` | derived | `src/lib/projection/` |
| `Projection` | derived | `src/lib/projection/` |

### 1.1 `Transaction`

```ts
type Transaction = {
  id: string;                    // ULID. Sortable by creation time.
  kind: 'income' | 'expense';
  name: string;                  // 1..80 chars. Trimmed on save.
  amount: Money;                 // Always positive integer minor units.
  occurredOn: IsoDate;           // 'YYYY-MM-DD'. Day matters for sort; month is the aggregation key.
  notes: string | null;          // 0..400 chars.
  createdAt: IsoDateTime;        // 'YYYY-MM-DDTHH:mm:ssZ'. UTC.
  updatedAt: IsoDateTime;
};

type Money = {
  amount: number;                // Integer. Minor units of the stored currency.
  currency: 'VND' | 'USD';       // Stored currency. Immutable after creation.
};
```

The combination of `kind` and a positive `amount` matters because:

- It eliminates a class of "negative amount on an income row" bugs.
- The Cash Flow table can render the typographic minus glyph for expenses without inspecting the sign.
- CSV import/export round-trips are unambiguous.

### 1.2 `PortfolioConfig`

```ts
type AssetClass = 'stocks' | 'savings' | 'cash' | 'gold' | 'usd';

type AssetAllocation = Record<AssetClass, number>;

// Fixed allocation per the teacher's clarification (2026-05-10). Field exists for
// forward-compat and persistence schema, but the runtime value MUST equal ASSET_ALLOCATION.
// Validation (Zod) enforces this; user cannot override.
const ASSET_ALLOCATION: AssetAllocation = {
  stocks:  0.50,
  savings: 0.10,
  cash:    0.10,
  gold:    0.10,
  usd:     0.10,
};

type PortfolioConfig = {
  allocation: AssetAllocation;       // Must equal ASSET_ALLOCATION at runtime.
  tickers: TickerSelection[];        // Length === 5. Funds the stocks portion (50% of net flow).
                                     // Fewer than 5 = portfolio incomplete; Simulation page warns.
  updatedAt: IsoDateTime;
};

type TickerSelection = {
  symbol: string;                    // 'AAPL', 'VNM.HM', etc. Vendor-format-preserving.
  description: string;               // 'Apple Inc.' — captured at pick time, displayed even if Finnhub is offline.
  exchange: string | null;           // 'NASDAQ', 'HOSE', etc. From Finnhub /search.
  pickedAt: IsoDateTime;
};
```

> **Spec correction (post-Phase-1.W7 — teacher clarification 2026-05-10).** The earlier draft used `ratio: number` (a single 0.30–0.50 value driving a stock-only portfolio). The teacher mandates a fixed five-asset allocation. The `ratio` field is removed; `allocation` replaces it. Phase 3.1 ships the LocalStorage migration: existing persisted records with `ratio` are dropped (`get()` returns null on shape mismatch), the consumer falls back to `DEFAULT_PORTFOLIO_CONFIG`. Per Phase 2.1's auto-seed-no-persist convention, no destructive writes occur during migration.

Live price is **not** stored. It is fetched on demand and cached in memory only — never persisted. The simulation does not depend on it.

### 1.3 `Settings`

```ts
type Settings = {
  displayCurrency: 'VND' | 'USD';
  theme: 'g90' | 'g100' | 'white';
  finnhubKey: string | null;     // User-supplied. Stored in LocalStorage. Documented as such.
  fxAutoRefresh: boolean;        // Default true. Refresh once per UTC day.
  schemaVersion: number;         // For LocalStorage migrations. Current: 1.
};
```

The Finnhub key is user-supplied because the project is a school assignment and the student does not run a billed backend. The Settings page documents the trust posture (key sits in your browser; clear on logout).

**Cookie mirror for SSR-readable fields (added Phase 0.4).** `theme` and `displayCurrency` are additionally mirrored as cookies (`flowstate-theme`, `flowstate-currency`) so Server Components can read them at request time and emit the correct `<html className="cds--{theme}">` class on the very first byte of HTML — preventing a flash of wrong theme on first paint. The cookies are non-`HttpOnly` (the client must write them), `SameSite=Lax`, `Path=/`, `Max-Age=31536000`. The cookie is the source of truth for SSR; the LocalStorage record (when the full `SettingsRepository` LocalStorage adapter ships in a later phase) is the source of truth for the client. The `SettingsRepository.set()` implementation is responsible for keeping both in sync. The other fields (`finnhubKey`, `fxAutoRefresh`, `schemaVersion`) live only in LocalStorage — `finnhubKey` because it must never be sent on every HTTP request, the others because they don't need to be SSR-readable.

### 1.4 `FxRateSnapshot`

```ts
type FxRateSnapshot = {
  base: 'USD';                   // open.er-api.com base.
  rates: { VND: number; USD: number };
  fetchedAt: IsoDateTime;
};
```

Cached; refreshed on app boot if the snapshot is older than the current UTC date.

### 1.5 Derived: `MonthlyAggregate`

```ts
type YearMonth = `${number}-${number}`;   // 'YYYY-MM'

type MonthlyAggregate = {
  yearMonth: YearMonth;
  inflow: Money;                          // Sum of incomes for that month, display currency.
  outflow: Money;                         // Sum of expenses for that month, display currency.
  netFlow: Money;                         // inflow - outflow. Can be negative.
  // Per-asset monthly contribution. Each is max(0, floor(netFlow × ASSET_ALLOCATION[asset])).
  // All zero if netFlow < 0.
  byAsset: Record<AssetClass, Money>;
  perStockInvestment: Money;              // byAsset.stocks / 5. Floor-divided in minor units.
};
```

### 1.6 Derived: `Projection`

```ts
type Projection = {
  scenarios: ProjectionScenario[];        // Length 3. Variants: 'low' (15%) | 'mid' (17.5%) | 'high' (20%).
  contributionMonths: 60;
  totalMonths: 360;
};

type ProjectionScenario = {
  variant: 'low' | 'mid' | 'high';
  annualStockRate: 0.15 | 0.175 | 0.20;   // Drives the spread; non-stock rates are constant.
  // Total portfolio (sum across all 5 assets), end-of-month, months 0..360.
  series: ProjectionPoint[];
  milestones: AssetMilestones;            // For total portfolio.
  totalContributed: Money;                // Sum of contributions across all 5 assets, months 1..60.
                                          // Constant across scenarios.
  byAsset: Record<AssetClass, AssetSeries>;  // Per-asset breakdown.
};

type AssetSeries = {
  series: ProjectionPoint[];              // Length 361. Per-asset value over time.
  milestones: AssetMilestones;            // Per-asset.
  totalContributed: Money;                // Per-asset contribution sum across months 1..60.
};

type AssetMilestones = {
  yr10: Money;                            // Month 120
  yr20: Money;                            // Month 240
  yr30: Money;                            // Month 360
};

type ProjectionPoint = {
  monthIndex: number;                     // 0..360
  value: Money;                           // Was `portfolioValue` pre-Phase-3.1; renamed for clarity.
};
```

Per-ticker breakdown at the milestones is `byAsset.stocks.milestones.yr10 ÷ 5` etc. — computed at render time, not stored.

> **Spec correction (post-Phase-1.W7).** Pre-Phase-3.1, `Projection` was stocks-only with a single `series` per scenario and a single rate. The new shape adds `byAsset` per scenario. The Dashboard reads `scenarios[1].milestones.yr30` (mid scenario, total) — that path still resolves but now refers to the total portfolio across all 5 assets, which is the correct upgrade. The `portfolioValue` field on `ProjectionPoint` is renamed to `value`; one rename across the codebase.

## 2. Money discipline

Three rules. Violations cause silent rounding bugs.

1. **Integer minor units only.** VND minor unit = 1 đồng (no sub-unit; VND is effectively unitary but we still treat it as integer). USD minor unit = 1 cent.
2. **Currency tag travels with the amount.** A bare number is always a defect; pass `Money`, not `number`.
3. **Conversion on display, not on storage.** A transaction entered in VND stays in VND in the database forever. The Cash Flow table converts to display currency at render time using the cached FX snapshot.

Helpers live in `src/lib/currency/`:

```ts
add(a: Money, b: Money, fx: FxRateSnapshot): Money
subtract(a: Money, b: Money, fx: FxRateSnapshot): Money
convert(money: Money, to: Currency, fx: FxRateSnapshot): Money
format(money: Money, locale: 'vi-VN' | 'en-US'): string  // Locale-aware. Tabular.
parseUserInput(s: string, currency: Currency): Money     // Used by NumberInput onChange.
```

Convert before add. Add is undefined for mismatched currencies without an FX snapshot. The convert function uses banker's rounding on the minor unit; documented in the function comment.

## 3. Validation — Zod schemas

One schema per entity. The same schema validates UI submits and CSV imports.

```ts
// src/lib/transactions/schema.ts
export const transactionInputSchema = z.object({
  kind: z.enum(['income', 'expense']),
  name: z.string().trim().min(1).max(80),
  amount: z.number().int().nonnegative(),
  currency: z.enum(['VND', 'USD']),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().trim().max(400).nullable().default(null),
});
```

UI binding: Carbon's `<TextInput>` / `<NumberInput>` / `<DatePicker>` all expose `invalid` + `invalidText`. The Zod error map produces those strings.

CSV binding: parser maps CSV rows to the same shape, then runs the schema. Error rows are reported as a list of `{ row, field, message }` and surfaced in a Carbon `<DataTable>` inside an error panel.

## 4. Repository interface — the swap seam

UI never touches `localStorage`. UI calls a `Repository`. The MVP wires a LocalStorage adapter; a future Supabase/WorkOS adapter swaps in without UI changes.

```ts
// src/lib/transactions/repository.ts
export interface TransactionRepository {
  list(): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | null>;
  create(input: TransactionInput): Promise<Transaction>;
  update(id: string, patch: Partial<TransactionInput>): Promise<Transaction>;
  remove(id: string): Promise<void>;
  bulkCreate(inputs: TransactionInput[]): Promise<Transaction[]>;   // CSV import
  clear(): Promise<void>;                                            // For tests + Settings reset
}
```

Likewise `PortfolioConfigRepository`, `SettingsRepository`. Each is a single-record store (get/set semantics).

```ts
export interface SingletonRepository<T> {
  get(): Promise<T>;
  set(value: T): Promise<void>;
}
```

All methods are async even when the LocalStorage adapter is synchronous. This costs nothing today and prevents a future shape change.

## 5. LocalStorage adapter — concrete behavior

Storage keys (all prefixed):

```
flowstate:v1:transactions      // JSON array of Transaction
flowstate:v1:portfolio         // JSON object (PortfolioConfig)
flowstate:v1:settings          // JSON object (Settings)
flowstate:v1:fx                // JSON object (FxRateSnapshot)
flowstate:v1:meta              // { schemaVersion: 1, createdAt: ... }
```

Behavior (the adapter is in `src/lib/`, which has zero UI deps — so it does not render UI; it throws typed errors that the UI layer catches and renders):

- **Writes** detect `QuotaExceededError` (cross-browser: `DOMException` with `name === 'QuotaExceededError'` or legacy code `22`) and throw `StorageQuotaExceededError` (a typed subclass exported from `src/lib/storage/errors.ts`). The UI layer catches this and renders a Carbon `<ActionableNotification>` ("Browser storage is full. Export your data and reset."). Other write errors propagate.
- **Reads** return the supplied default if the key is missing or unparseable. An unparseable value triggers a backup (renames the bad key to `<key>.broken-YYYY-MM-DD`, e.g. `flowstate:v1:transactions.broken-2026-04-28`) and the read returns the default. Reads never throw into the UI.
- The adapter exposes `createStorageAdapter(storage?: Storage)` returning a `{ read, write, remove }` object. Storage is injectable for tests (a fake `Storage` implementation backed by a `Map`). Repositories compose on top of the adapter.

> **Spec correction (post-Phase-1.1).** An earlier draft said the adapter "surfaces a Carbon `<ActionableNotification>`" itself. That contradicted the architecture rule that `src/lib/` has zero UI deps. The correct split — adapter throws typed error, UI renders notification — shipped in Phase 1.1 and is reflected above.

## 6. CSV import / export

Round-trip-safe. Header row + UTF-8 + `\r\n` line endings. RFC 4180 quoting. UTF-8 BOM accepted (and stripped) on import; never written on export.

```
date,kind,name,amount,currency,notes
2026-04-01,income,Salary,18000000,VND,April salary
2026-04-05,expense,Rent,5500000,VND,
```

**Column order is normative** (the parser is header-driven, but the serializer always emits this order):

1. `date` — ISO `YYYY-MM-DD`. Maps to `Transaction.occurredOn`.
2. `kind` — `income` or `expense` (lowercase).
3. `name` — free text.
4. `amount` — **major units** as a string. VND has zero decimals (`50000`); USD has exactly two (`500.00`). Non-negative.
5. `currency` — `VND` or `USD`.
6. `notes` — free text. Empty cell = `null` after parse.

**Why major units, not minor units (revised post-Phase-1.4).** An earlier draft of this section specified minor units to match storage exactly. That changed during Phase 1.4: the CSV is meant to be human-editable (graders open it in Excel), and `50000000` is unreadable as VND salary while `$500.00` is unambiguous as USD. The trade-off — having to parse decimals carefully to avoid float rounding — is solved in `src/lib/csv/parse.ts` by string-splitting on `.` and rejecting anything that doesn't match `^(\d+)(?:\.(\d{2}))?$` for USD. **Never `parseFloat` a monetary string.**

Import validates with the same Zod schema as the UI form. Export emits in the user's stored currency, not display currency — round-tripping must be lossless. Embedded newlines in `name` or `notes` are normalized to spaces during serialize so that the parser's line-split-then-tokenize design works without a multi-line record special case.

The implementation lives in `src/lib/csv/` and exposes `parseCsv(text): { valid: Transaction[]; errors: ParseError[] }` and `serializeCsv(transactions): string`. Vitest covers the round trip on a hand-written fixture covering both currencies, both kinds, names with commas/quotes/accents, and same-date transactions.

> **Spec correction (post-Phase-1.4).** The earlier draft of this section listed columns as `kind,name,amount,currency,occurredOn,notes` with `amount` in minor units. The implementation diverged during Phase 1.4 (per the prompt's explicit override) to put `date` first, rename `occurredOn → date` for human readability, and switch `amount` to major units. This section is now the source of truth; the implementation matches.

## 7. The future-sync seam

A future "log in to sync" flow swaps the LocalStorage adapter for a remote one. The remote design is **out of MVP scope**, but the shape is fixed now:

- Auth: WorkOS AuthKit. The user's session token is read by a Next.js middleware and attached to a server-side fetch helper.
- Server: Next.js route handlers proxy to a database (Cloudflare D1, Supabase, or similar — TBD). Repositories on the client become thin HTTP clients.
- Conflict policy: last-write-wins on `updatedAt` for MVP-grade sync. A real CRDT is not warranted.
- Migration: a one-shot "import LocalStorage to your account" button on first login. The repository contract makes this a `localRepo.list() → remoteRepo.bulkCreate()`.

The point of stating this now is not to build it; it is to ensure today's code does not foreclose it.

## 8. Schema versioning + migration

`Settings.schemaVersion` is bumped whenever the persisted shape changes. A `migrate(fromVersion, toVersion)` function in `src/lib/storage/migrations.ts` runs at app boot inside the LocalStorage adapter. v1 → v2 migrations rename keys and reshape rows in-place.

For the MVP only **v1** exists. The migration scaffolding is set up empty so the first real change is a one-file PR, not an architectural one.

## 9. What is NOT in the data model

Spelled out so future "but should we add..." conversations short-circuit:

- **Tags / categories on transactions.** Out of MVP. The brief asks for name + amount + date + notes; that is what we store.
- **Recurring transactions.** Out of MVP. A user enters each month manually. (Stretch goal noted in feature spec §6.)
- **Multi-portfolio.** One portfolio per user.
- **Historical price data per ticker.** Live prices are display-only, never stored.
- **Audit log of changes.** `updatedAt` only.
- **Soft delete.** Hard delete; the user can re-import from CSV if they exported.
