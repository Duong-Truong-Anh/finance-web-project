# AI Process Log — Finance Cash Flow & Investment Simulator

## Assignment Overview
Build a personal/business cash flow management website with long-term stock investment simulation using AI software as a supporting tool.

---

## AI Tools Used

| Tool | Purpose |
|---|---|
| Claude Code (claude-sonnet-4-6) | Primary development assistant — architecture decisions, code generation, debugging, UX planning |
| Google AI Studio / Claude.ai | Visual prototyping of layout and chart interactions before coding |

---

## How AI Was Used (Session Log)

### Session 1 — Planning & Architecture (2026-04-20)

**What I asked the AI to do:**
- Read and analyze the assignment brief together
- Brainstorm how to go "one better" than a basic implementation
- Evaluate tech stack options and make recommendations
- Search for installable skills that could assist development

**Key decisions made with AI assistance:**

1. **Chose D3.js over Visx** — Originally considered Visx (React-based data viz) but AI clarified Visx is built on top of D3 and requires React. Since the project targets pure HTML5, D3.js directly gives more control with no framework dependency.

2. **Live stock API integration** — Student idea to use a free external API (Finnhub recommended) so users pick real stock tickers instead of typing arbitrary codes. The growth simulation still uses the assignment's 15–20% assumption, but the stock selection feels credible and grounded.

3. **Reframed the UX mental model** — Instead of "accountant entering line items," the target experience is "understanding my financial trajectory." This shapes every layout and interaction decision.

4. **Clarified the 5-year rule** — The assignment's "first 5 years" means: the default view is the 5-year input phase where users enter monthly income/expenses and set the investment ratio (30–50%). The simulation then projects forward to 10/20/30-year milestones.

5. **Dual-band growth chart** — Show a shaded region between 15% and 20% growth scenarios rather than a single line. This communicates the *range of futures* and is more financially meaningful.

6. **GSAP compound curve animation** — Animate the growth curve drawing itself over the 30-year timeline. The inflection point where compounding visibly accelerates is the single most important concept in the assignment — motion makes it comprehensible.

**Skills installed locally:**
```
npx skills add davila7/claude-code-templates@d3-viz -y
npx skills add wshobson/agents@kpi-dashboard-design -y
npx skills add finsilabs/awesome-ecommerce-skills@financial-reporting-dashboard -y
```

---

## Tech Stack Decisions

| Layer | Choice | Reason |
|---|---|---|
| Core | HTML5 + Vanilla JS | Assignment requires plain web, no framework needed |
| Styling | Vanilla Extract | Zero-runtime CSS-in-TS, enforces design tokens cleanly |
| Motion | GSAP | Best-in-class for choreographed SVG/DOM animations |
| Data Viz | D3.js | Foundation library, no React dependency, full control |
| UI Components | Zag UI or Native HTML | Accessible form patterns (sliders, inputs) |
| Stock Data | Finnhub API (free tier) | Real ticker search, 60 calls/min free |
| Storage | localStorage | Sufficient for assignment scope, no backend needed |

---

## Core Calculation Logic

### Net Cash Flow
```
Monthly Net Cash Flow = Total Monthly Inflows − Total Monthly Outflows
```

### Monthly Investment Amount
```
Monthly Investment = Monthly Net Cash Flow × Investment Ratio (30%–50%)
Per Stock Allocation = Monthly Investment ÷ 5
```

### Compound Growth Simulation
```
Future Value = P × (1 + r/12)^(n×12)

Where:
  P = total invested principal at end of year 5
  r = annual growth rate (0.15 to 0.20)
  n = years remaining (5→10, 5→25, 5→30 from start)
```

Note: Contributions happen monthly during years 1–5. After year 5, the portfolio compounds on accumulated value only.

---

## UX Design Decisions

### Layout: Bento Box Dashboard
- **Left panel:** Income/expense input forms
- **Center:** Live cash flow summary + investment ratio slider
- **Right:** Compound growth projection chart

Spatial logic mirrors the mental model: *put money in → see what flows → see where it goes.*

### Key Interactions
1. **Live feedback** — projection updates in real-time as income/expense values change
2. **Dual-band chart** — shaded area between 15% and 20% scenario shows range of futures
3. **Animated curve draw** — GSAP draws the compound curve, inflection point is revealed progressively
4. **Milestone callouts** — 10/20/30yr markers are interactive hover points showing per-stock values
5. **Stock ticker search** — Finnhub API powers real ticker lookup instead of manual text entry

---

## What I Understood and Can Explain

- The compound interest formula and why monthly contributions during years 1–5 behave differently after the contribution period ends
- Why D3.js was chosen over Visx and what the tradeoff is
- How the investment ratio slider maps to the monthly allocation math
- Why the dual-band chart (15%–20% range) is more informative than a single projected line
- The localStorage data model for persisting income/expense records

---

## Prototype Plan (Before Coding)
1. Visual layout prototype in Google AI Studio / Claude.ai artifacts
2. Validate: bento layout, slider → live update interaction, dual-band chart shape
3. Then move to full implementation in Claude Code

---

## Session 2 — Implementation & Debugging (2026-04-21)

**What I asked the AI to do:**
- Build the full working dashboard (HTML, CSS, JS) from the prototype design
- Wire all panels to shared state with live slider updates
- Implement GSAP page-entrance animations and projection chart reveal
- Implement D3 dual-band projection chart and grouped bar cashflow chart
- Debug a series of chart animation issues
- Set up an agent-handoff document for context continuity across sessions

**Work completed:**

1. **Full bento dashboard built** — Three-column CSS grid layout (`240px 280px 1fr`), header spanning only cols 1–2 (right slot reserved for future dashboard-mode switcher). All panels wired to a single `state` object.

2. **D3 projection chart** — Dual-band area chart between 15% and 20% annual growth. ClipPath reveal animation. Crosshair + tooltip on hover. Milestone callout boxes at Yr10/20/30. Milestone breakdown table below chart.

3. **D3 cashflow chart** — Grouped bar chart (income/expense per month) with net flow line overlay. Tooltip on hover. Cashflow table below chart. Tab switching between projection and cashflow views.

4. **GSAP animations implemented:**
   - Page entrance: panels fade/slide in staggered
   - Projection: clipPath width 0→iW reveals chart left-to-right
   - Cashflow: bars grow from x-axis upward, net line draws, dots pop in
   - Slider: smooth GSAP tween between ratio values (no snappy redraws)
   - Number count-up: investment/savings metrics count from 0 on load

5. **Bugs diagnosed and fixed:**
   - *Glimpse of chart before animation:* Fixed by synchronously collapsing bars to `y=baseline, height=0` immediately after D3 draws them (before browser paints)
   - *Baseline reference error:* Was using `iH` (inner height) as baseline. Fixed with `const baseline = ySc(0)` — correctly accounts for `.nice()` domain padding
   - *GSAP `from` race condition:* Switched from `gsap.from` to `gsap.to` with stored final values

6. **Bar animation rewrite (Session 3 start):** GSAP proxy approach broke the invariant `y + height = baseline` because GSAP interpolates `y` and `height` as independent tweens. Rewrote in Session 3 using D3 native transitions — both attributes are computed in one transition block, mathematically guaranteeing the invariant holds at every frame.

**Key decision — agent-handoff skill:**
After hitting context limits, I decided to use the `agent-handoff` skill installed in `.claude/skills/` to create a structured handoff document. This lets future AI sessions pick up context without re-deriving everything from scratch. The handoff document is at `docs/agent/agent-handoff.md`.

**Skills used this session:**
- `d3-viz` — referenced for D3 chart patterns (interactive template)
- `agent-handoff` — used to create cross-session context document

---

## What I Understand and Can Explain (Extended)

- Why `ySc(0)` must be used as the bar baseline (not `iH`) when D3's `.nice()` pads the domain
- Why D3 native transitions maintain `y + height = constant` at every frame (both attrs computed from same source in one tween), while GSAP animating them separately cannot guarantee this
- How the GSAP `tweenedRatio` proxy object smooths slider updates without `onInput` triggering full redraws at 60fps independently
- Why `animated.cashflow = true` is set at the *start* of entrance (not end) — prevents `drawCashflow` from re-collapsing bars if ResizeObserver fires during animation
- How the ClipPath SVG pattern enables a "wipe left-to-right" reveal on the projection chart
- Why `requestAnimationFrame` is needed before drawing when switching tabs (tab must be visible so container has correct clientWidth/Height)

---

## Session 3 — Project Renovation: V1 Retired, Flowstate Initiated (2026-04-23)

**What I asked the AI to do:**
- Retire the V1 direction (vanilla HTML/CSS/JS bento dashboard)
- Archive the original brief (`finance project.md` → `archive/finance-project-v1.md`)
- Scaffold a new project from scratch under the Flowstate product spec

**Why the direction changed:**

The V1 implementation (bento dashboard, GSAP animations, Finnhub live API, dual-band chart) was a valid interpretation of the assignment brief but lacked a coherent product identity. After writing a full product spec — a narrative vision, PRD, and feature spec across three documents — the project was reoriented around **Flowstate**: a personal cash flow and long-term investment simulator with a deliberate design posture, a keyboard-first interaction model, and an architecture built for a post-MVP backend swap.

Key differences from V1:

| Dimension | V1 | Flowstate |
|---|---|---|
| Stack | Vanilla HTML/CSS/JS + Bun server | Astro 5 + React islands + TypeScript |
| Styling | Vanilla Extract | CSS modules + Tailwind (layout utilities only) |
| Data viz | D3 + GSAP | D3 (Sankey, line) + Recharts (area, bar) |
| Stock data | Finnhub live API | Parameterized lognormal return model (seeded) |
| Design posture | Bento dashboard, animated | Anti-AI: no gradients, serif/sans hierarchy, editorial layout |
| Architecture | Single-file state | Repository pattern, modular lib layer |

**What was archived:**
- `finance project.md` → `archive/finance-project-v1.md` (original assignment brief and V1 notes)
- `src/` (V1 HTML/CSS/JS) — deleted as part of scaffold swap
- `README.md` (V1) — replaced

**New documents added:**
- `new-project-doc/narrative-vision.md` — product vision and design posture
- `new-project-doc/prd.md` — full PRD with architecture, data model, performance budgets
- `new-project-doc/feature-spec.md` — JTBD-framed feature spec for all 8 jobs

**Scaffold swap performed:**
- Initialized Astro 5 project with Bun, React integration, TypeScript, Tailwind
- Established base folder structure per PRD module boundaries (`/src/lib`, `/src/features`, `/src/components`, `/src/styles`)

**What I understand and can explain:**
- Why Astro's islands architecture was chosen over Next.js (minimal JS by default, fits Cloudflare Pages, discourages monolithic JS bundles)
- Why Tailwind is used for layout utilities only — full Tailwind-by-default is a strong AI-slop signal; component styling lives in CSS modules
- Why shadcn/ui was rejected despite being excellent — its default aesthetic is the exact aesthetic Flowstate rejects
- Why the projection engine must be a pure TypeScript function with no UI dependencies — it needs to run in 50ms on input change, be testable in isolation, and be extensible to Monte Carlo without a rewrite
- Why the data layer uses a Repository interface from day one — the LocalStorage → Cloudflare D1 swap must be a single implementation swap, not a rewrite
