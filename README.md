# Finance Cash Flow & Investment Simulator

A personal finance dashboard that tracks monthly cash flow and simulates long-term stock investment growth. Built as a university practical assignment demonstrating the use of AI tools in web development.

> **For the instructor:** AI usage is documented in detail in [`AI-PROCESS-LOG.md`](./AI-PROCESS-LOG.md). The agent handoff documents used to maintain AI context across sessions are in [`docs/agent/`](./docs/agent/).

---

## Table of Contents

- [Assignment Context](#assignment-context)
- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [Math & Formulas](#math--formulas)
- [Project Structure](#project-structure)
- [AI Usage Summary](#ai-usage-summary)
- [What I Understand and Can Explain](#what-i-understand-and-can-explain)

---

## Assignment Context

This project fulfills a practical assignment requiring students to:

- Record monthly income and expense items
- Calculate monthly net cash flow (`Inflows − Outflows`)
- Allow the user to set an investment ratio (30%–50% of net cash flow)
- Equally allocate that investment across 5 stock codes
- Simulate portfolio value at **10, 20, and 30 years** assuming **15%–20% annual growth**
- Display results in statistical charts

The goal was to go "one better" than a basic implementation — so rather than a plain table, this is a fully interactive bento-grid dashboard with animated D3.js charts, GSAP entrance animations, and a real-time investment slider.

---

## Live Demo

No hosting yet — run locally (see [Getting Started](#getting-started)).

Screenshots: *(add after final polish)*

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Core | HTML5 + Vanilla JavaScript | Assignment requires plain web, no framework needed |
| Styling | Vanilla CSS with custom properties | Design tokens via CSS variables, no build step required |
| Motion | [GSAP 3](https://gsap.com/) | Best-in-class choreographed SVG/DOM animations |
| Data Viz | [D3.js v7](https://d3js.org/) | Full control over SVG charts; no React dependency |
| Dev Server | [Bun](https://bun.sh/) | Fast file server with hot reload, zero config |
| Stock Data | Hardcoded (Finnhub API planned for V3) | Static for V1; live ticker search in roadmap |
| Storage | localStorage (planned for V2) | No backend needed for assignment scope |

**No framework. No build pipeline. No bundler.** The browser loads `index.html` directly; D3 and GSAP are loaded from CDN.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) — install via:
  ```bash
  # macOS / Linux
  curl -fsSL https://bun.sh/install | bash

  # Windows (PowerShell)
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```

### Run the dev server

```bash
# Clone the repo
git clone <repo-url>
cd finance-web-project

# Install dev dependencies (TypeScript types only)
bun install

# Start the server with hot reload
bun --hot src/server.ts
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

That's it. No build step, no environment variables, no database setup.

### Alternative — open directly

Since this is a static site, you can also just open `src/index.html` directly in a browser. The Bun server is only needed for hot reload during development.

---

## How It Works

### Dashboard Layout

The UI is a **bento-grid dashboard** with three columns:

```
┌─────────────────┬──────────────┬───────────────────────────┐
│  HEADER (cols 1–2)             │  Reserved (col 3)          │
├─────────────────┼──────────────┼───────────────────────────┤
│                 │              │                           │
│  Cashflow       │  Net Cash    │  Projection — 30yr        │
│  Ledger         │  Summary     │  (D3 dual-band area chart)│
│                 │              │                           │
│  Income items   │  Invest.     │  ─── or ───               │
│  Expense items  │  Allocation  │                           │
│  Net total      │  Slider      │  Monthly Flow             │
│                 │  (30–50%)    │  (D3 grouped bar chart)   │
│                 │              │                           │
└─────────────────┴──────────────┴───────────────────────────┘
```

### Shared State

All panels read from a single `state` object in `src/js/main.js`:

```javascript
const state = {
  netMonthly: 3145,      // monthly net cash flow
  ratio: 40,             // investment ratio (%)
  contribYears: 5,       // contribution phase
  totalYears: 30,        // simulation window
  growthLo: 0.15,        // 15% annual growth scenario
  growthHi: 0.20,        // 20% annual growth scenario
  tickers: [...],        // 5 stock codes
  monthlyLedger: [...],  // 12-month income/expense data
};
```

When the slider moves, all derived values (investment pool, savings pool, stock allocations, both charts) update in real time.

### Charts

**Projection Chart (right panel, tab 1)**
- D3.js dual-band area chart
- Shaded region between the 15% and 20% growth scenarios — shows the *range of futures* rather than a single false-precision line
- ClipPath SVG technique reveals the chart left-to-right (GSAP animates `clipPath` width from 0 to full)
- Milestone callout boxes at Yr10 / Yr20 / Yr30
- Crosshair + tooltip on hover

**Monthly Flow Chart (right panel, tab 2)**
- D3.js grouped bar chart — one group per month, income bar vs expense bar side by side
- Net cash flow line overlay with animated dots
- Bars grow from the x-axis baseline on first load (D3 native transitions)
- Full wipe-and-rebuild pattern: `cfSvg.selectAll('*').remove()` on every draw call — avoids stale D3 selection state

### Animations

| Element | Tool | Technique |
|---|---|---|
| Page entrance | GSAP | Panels fade + slide in staggered |
| Projection chart reveal | GSAP | `clipPath` width 0 → full |
| Bar chart entrance | D3 transitions | `y` + `height` animated together in one transition block |
| Net line draw | GSAP | `strokeDashoffset` 0 → 0 |
| Slider updates | GSAP | Smooth tween via `tweenedRatio` proxy — no jank at 60fps |
| Metric count-up | GSAP | Numbers count from 0 on load |

---

## Math & Formulas

### Net Cash Flow

```
Monthly Net Cash Flow = Total Monthly Inflows − Total Monthly Outflows
```

### Investment Allocation

```
Monthly Investment  = Monthly Net Cash Flow × Investment Ratio (30%–50%)
Per-Stock Allocation = Monthly Investment ÷ 5
```

### Compound Growth Simulation

During the 5-year contribution phase, monthly deposits compound as they're added:

```
FV = Σ [deposit × (1 + r/12)^(months_remaining)]
```

After year 5, the accumulated principal compounds without new deposits:

```
FV = P × (1 + r/12)^(n × 12)

Where:
  P = total portfolio value at end of year 5
  r = annual growth rate (0.15 or 0.20)
  n = years remaining (e.g., 5 more years to reach Yr10 milestone)
```

The code implements this as a year-by-year loop (`buildSeries` in `main.js`), which correctly handles the phase transition at year 5:

```javascript
function buildSeries(ratio, rate) {
  const dep = state.netMonthly * (ratio / 100);
  const mr = rate / 12;
  let pv = 0;
  for (let yr = 0; yr <= state.totalYears; yr++) {
    const d = yr < state.contribYears ? dep : 0; // contributions stop at yr 5
    for (let m = 0; m < 12; m++) pv = pv * (1 + mr) + d;
  }
}
```

---

## Project Structure

```
finance-web-project/
├── src/
│   ├── index.html          # Single page — all markup
│   ├── server.ts           # Bun dev server (static file server)
│   ├── css/
│   │   └── main.css        # All styles — CSS custom properties for design tokens
│   └── js/
│       └── main.js         # All logic — shared state, D3 charts, GSAP animations
├── docs/
│   └── agent/
│       └── agent-handoff.md  # AI session context document (see below)
├── AI-PROCESS-LOG.md       # Detailed AI usage log (assignment grading artifact)
├── finance project.md      # Original assignment brief
├── package.json
├── bun.lock
└── tsconfig.json
```

`main.js` is organized in sections:
1. Shared state object
2. Math functions (`buildSeries`)
3. Projection chart (`drawProjection`, `runProjectionEntrance`)
4. Cashflow chart (`drawCashflow`, `runCashflowEntrance`)
5. Slider + UI wiring
6. Page entrance animation

---

## AI Usage Summary

AI tools used: **Claude Code** (claude-sonnet-4-6) via the Claude Code CLI.

| Session | What AI Did |
|---|---|
| Session 1 | Brainstormed the "one better" approach, evaluated tech stack, clarified the 5-year compound interest rule, recommended the dual-band chart concept |
| Session 2 | Built the full dashboard (HTML, CSS, JS), wired all panels to shared state, implemented both D3 charts, implemented GSAP animations, debugged bar animation bugs |
| Session 3 | Rewrote the cashflow chart from scratch to fix a persistent animation invariant bug (`y + height = baseline` must hold at every interpolated frame) |

**Full detail:** See [`AI-PROCESS-LOG.md`](./AI-PROCESS-LOG.md) — covers every decision made with AI assistance, what was accepted, what was revised, and what I understood and can explain independently.

**Agent handoff documents:** See [`docs/agent/agent-handoff.md`](./docs/agent/agent-handoff.md) — used to maintain AI context across sessions without re-deriving state from scratch.

---

## What I Understand and Can Explain

These are the non-obvious decisions I made with AI assistance that I can explain independently:

1. **Why `ySc(0)` not `iH` as the bar baseline** — D3's `.nice()` pads the y-axis domain so the zero crossing doesn't land exactly at `iH`. Using `iH` would make bars float above the x-axis.

2. **Why D3 native transitions for bars, not GSAP** — GSAP animates `y` and `height` as two independent tweens. At any given frame, `y + height ≠ baseline` because the values aren't coordinated. D3's single `.transition()` block computes both from the same data function at each interpolated frame, mathematically guaranteeing `y + height = baseline` always holds.

3. **Why `animated.cashflow = true` is set at the START of entrance** — If a `ResizeObserver` fires while the animation is playing, `drawCashflow` would re-collapse bars to `height=0` before the animation finishes. Setting the flag first prevents this.

4. **Why the wipe-and-rebuild pattern** — D3's `.join()` on persistent SVG groups does enter+update on existing elements. When `drawCashflow` was called again (slider, resize), the bars would snap to final position before `runCashflowEntrance` could animate them. Wiping and recreating from scratch eliminates this stale-state problem.

5. **The dual-band chart rationale** — A single projected line implies false precision. The shaded band between 15% and 20% is more honest: it shows that the future is a range, and the compounding effect (the inflection point) is still visible and comprehensible.

6. **The compound interest phase transition** — Monthly deposits happen during years 1–5 only. After year 5, the full accumulated principal continues compounding but receives no new deposits. The code sets `d = 0` for `yr >= contribYears` — a single conditional inside the loop handles the entire behavioral change.

---

## Roadmap

- [x] V1 — Static dashboard with D3 charts and GSAP animations
- [ ] V2 — CRUD for income/expense entries with localStorage persistence
- [ ] V3 — Finnhub API live stock ticker search (free tier, 60 calls/min)
