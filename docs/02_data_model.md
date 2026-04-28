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
type PortfolioConfig = {
  ratio: number;                 // 0.30 <= ratio <= 0.50. Step 0.01 in the slider.
  tickers: TickerSelection[];    // Length === 5. Fewer than 5 = portfolio incomplete; simulation page warns.
  updatedAt: IsoDateTime;
};

type TickerSelection = {
  symbol: string;                // 'AAPL', 'VNM.HM', etc. Vendor-format-preserving.
  description: string;           // 'Apple Inc.' — captured at pick time, displayed even if Finnhub is offline.
  exchange: string | null;       // 'NASDAQ', 'HOSE', etc. From Finnhub /search.
  pickedAt: IsoDateTime;
};
```

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
  inflow: Money;                 // Sum of incomes for that month, in display currency.
  outflow: Money;                // Sum of expenses for that month, in display currency.
  netFlow: Money;                // inflow - outflow. Can be negative.
  monthlyInvestment: Money;      // max(0, netFlow * ratio). Zero if netFlow < 0.
  perStockInvestment: Money;     // monthlyInvestment / 5. Floor-divided in minor units.
};
```

### 1.6 Derived: `Projection`

```ts
type Projection = {
  scenarios: ProjectionScenario[];   // Length 3. Rates: 0.15, 0.175, 0.20.
  contributionMonths: 60;
  totalMonths: 360;
};

type ProjectionScenario = {
  annualRate: 0.15 | 0.175 | 0.20;
  series: ProjectionPoint[];      // Length 361 (months 0..360). Sampled monthly.
  milestones: { yr10: Money; yr20: Money; yr30: Money };
  totalContributed: Money;        // Constant across scenarios. Sum of monthlyInvestment over months 1..60.
};

type ProjectionPoint = {
  monthIndex: number;             // 0..360
  portfolioValue: Money;
};
```

Per-stock breakdown at the milestones is `milestones.yr10 ÷ 5` etc. — computed at render time, not stored.

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

Behavior:

- All writes go through a single `safeWrite(key, value)` that catches `QuotaExceededError` and surfaces a Carbon `<ActionableNotification>` ("Browser storage is full. Export your data and reset.").
- Reads return defaults if the key is missing or unparseable. An unparseable key triggers a backup (renames the bad key to `flowstate:v1:transactions.broken-2026-04-28`) and starts fresh — never throws into the UI.
- The adapter is a pure module export — `createLocalStorageRepositories()` returns the four repositories. Tests substitute an in-memory adapter implementing the same interfaces.

## 6. CSV import / export

Round-trip-safe. Header row + UTF-8 + `\n` line endings. RFC 4180 quoting. `﻿` BOM optional on export.

```
kind,name,amount,currency,occurredOn,notes
income,Salary,18000000,VND,2026-04-01,April salary
expense,Rent,5500000,VND,2026-04-05,
```

The `amount` column is in minor units (matches storage). Import validates with the same Zod schema. Export emits in the user's stored currency, not display currency — round-tripping must be lossless.

The implementation lives in `src/lib/csv/` and exposes `parseCsv(text): { rows: TransactionInput[]; errors: ImportError[] }` and `serializeCsv(transactions): string`. Vitest covers the round trip on a 200-row fixture.

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
