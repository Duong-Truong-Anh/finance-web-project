## meta
- write_status: complete
- status: in-progress
- last_updated: 2026-04-21T00:00:00+07:00
- session_summary: Completed V1 dashboard build and rewrote cashflow bar chart from scratch to fix a persistent entrance animation bug.

## codebase_state
- Full bento dashboard is working: left ledger panel, center metrics + slider, right tabbed panel (projection / monthly flow).
- Projection chart (D3 dual-band area) is complete with clipPath reveal animation, crosshair tooltip, milestone callout boxes, and milestone breakdown table.
- Cashflow bar chart has been fully rewritten — `drawCashflow` clears the SVG and rebuilds from scratch on every call; no persistent layer groups exist.
- Cashflow entrance animation uses D3 native transitions on live selections stored in `_cf` — bars grow from `y=baseline, height=0` to final position; `y + height = baseline` is guaranteed at every frame.
- `_cf` module variable holds `{ ySc, baseline, data, incomeBars, expBars, netPath, dots }` — assigned at the end of each `drawCashflow` call; read by `runCashflowEntrance`.
- `animated.cashflow` is set to `true` at the START of `runCashflowEntrance` to prevent re-collapse if ResizeObserver fires mid-animation.
- GSAP handles: page entrance (panel fade/slide), projection clipPath reveal, net line dashoffset, dots pop-in, slider smooth tween via `tweenedRatio` proxy, and metric count-up.
- Slider range is 30–50%; connected via `smoothUpdate` which tweens `tweenedRatio` and calls `drawProjection` or `drawCashflow` on each frame.
- All data is static (hardcoded `state` object); no CRUD, no API, no localStorage yet.
- Dev server: `bun --hot src/server.ts` → localhost:3000.

## user_requests
1. Fix the cashflow bar entrance animation — bars were not growing from the x-axis baseline.
2. Update the agent-handoff document to reflect current session state.

## actions_taken
1a. Rewrote the entire cashflow chart section — removed pre-created persistent layer groups (`cfG`, `cfGridG`, `cfBarsG`, etc.).
1b. Modified `drawCashflow` to call `cfSvg.selectAll('*').remove()` at the top and rebuild all groups fresh each call.
1c. Modified `drawCashflow` to store live D3 selections in `_cf` at the end of the function instead of DOM-querying later.
1d. Rewrote `runCashflowEntrance` to use D3 `.transition()` on the stored selections — both `y` and `height` animated in one transition block per selection.
1e. Removed the unused `cfLastIH` variable and simplified `_cf` initialisation.
2. Created this file using the agent-handoff skill schema.

## files_touched
- modified  src/js/main.js
- modified  AI-PROCESS-LOG.md
- modified  docs/agent/agent-handoff.md

## key_decisions
- `drawCashflow` does a full wipe-and-rebuild (`cfSvg.selectAll('*').remove()`) on every call — chosen over the persistent-groups pattern because stale element state from D3 `.join()` updates was the root cause of the animation bug.
- D3 native transitions used for bar entrance (not GSAP) — GSAP animates `y` and `height` as two independent tweens which breaks the invariant `y + height = baseline`; D3 interpolates both in one transition block, guaranteeing it.
- `animated.cashflow` set to `true` at the START of `runCashflowEntrance` (not the end) — prevents `drawCashflow` (triggered by ResizeObserver or slider) from re-collapsing bars while the entrance is still playing.
- Live D3 selections stored in `_cf` after each `drawCashflow` — avoids re-querying the DOM in `runCashflowEntrance` against elements that may have been wiped and recreated.
- `baseline = ySc(0)` used throughout (not `iH`) — D3's `.nice()` pads the domain so `ySc(0) ≠ iH`.

## open_threads
- [ ] Verify bar entrance animation visually in browser — confirm bars grow from x-axis with no flash.
- [ ] Implement Task 6: CRUD for income/expense entries with localStorage persistence — left panel gets add/edit/delete, `state.monthlyLedger` becomes user-editable, all derived values recalculate.
- [ ] Implement Task 7: Replace hardcoded tickers with Finnhub symbol search API (free tier, 60 calls/min); selected tickers persist in localStorage.
- [ ] Update AI-PROCESS-LOG.md when Task 6 and 7 are complete.

## handoff
- tone: direct — do the work first, brief summary after. No preamble or recaps.
- first_action: Run `bun --hot src/server.ts`, open localhost:3000, switch to the Monthly Flow tab and verify bars grow from the x-axis on first load.
- external_blockers: none
- gotchas: `drawCashflow` wipes the entire SVG on every call — do not try to persist selections across calls; always read from `_cf` which is refreshed each draw. Tab container has zero dimensions when hidden (`display: none`) — always draw inside `requestAnimationFrame` after showing the tab.
