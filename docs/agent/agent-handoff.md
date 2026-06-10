## meta
- write_status: complete
- status: in-progress
- last_updated: 2026-05-20T22:00:00+07:00
- session_summary: Strategist handoff after 36 implementer sessions covering Phases 0 through 3.2c.1; codifies the Opus role, the prompt-writing methodology (pointer to flowstate-strategist skill), the multi-agent interaction pattern with the user and Gemini, the current queue, and reading order.

## codebase_state
- Flowstate is a Carbon-Design-System-native Next.js 16 / Bun / React 19 / TypeScript app: personal cash flow + 30-year multi-asset investment simulator. Built for a graded university assignment.
- Five-asset allocation is fixed: stocks 50%, savings 20%, cash 10%, gold 10%, USD 10% (sums to 1.00 per ADR 008 resolution).
- Phase 3.2c.1 (Finnhub /quote integration) pushed on PR #34 — awaiting user merge. Master is currently at Phase 1.6.3 (settings e2e + a11y resolution, PR #33) + Phase 3.2b Copilot fixes (toast timer + cache hygiene, PR #32).
- 36 sessions logged in `AI-PROCESS-LOG.md`. Canonical template lives in `CLAUDE.md § Updating AI-PROCESS-LOG.md`; new entries go immediately above the append-marker comment block; Session Index at top gets a new row in chronological order.
- 172 unit tests + 1 skipped; 23 e2e tests (warm dev server) green; 7 routes build clean; fallow:check 0 issues across the codebase.
- `computeProjection(input: ProjectionInput) → Projection` is locked at the Phase 3.1 integration contract. Per-asset breakdown lives in `byAsset` on each scenario.
- `PortfolioConfig.allocation` is Zod-`z.literal` enforced; not user-editable. Tickers are user-editable; Finnhub-backed search + quote landed in Phase 3.2b / 3.2c.1.
- `Settings.finnhubKey` is user-supplied, persisted in LocalStorage, sent via POST body on each ticker request (never URL, never console, never error message).
- The implementer is Sonnet 4.6 in a different conversation. The strategist (Opus) is THIS conversation. The user pastes prompts manually between the two.
- Gemini occasionally runs off-script audits (web standards, accessibility) when the user invites it directly; one such audit shipped as PR #33 in Session 35.
- Skills active for Flowstate: `flowstate-strategist` (methodology, auto-loads on strategist trigger phrases), `carbon-builder`, `impeccable` (Carbon-context configured via `/teach` + `/document`), `karpathy-guidelines`, `fallow` (condensed per ADR 006), `update-config`.
- `frontend-design` is behaviorally banned per ADR 007 — `skillOverrides` in `.claude/settings.json` is not a recognized field and was removed; behavioral prohibition is the only effective control.
- PRODUCT.md and DESIGN.md at repo root are the strategic and tactical frames; impeccable references them automatically. ADRs 001–008 in `docs/decisions/`.
- Cold-start e2e contention under 5-worker default parallelism is a known environmental issue (pre-existing, not a regression). Use `--workers=2` or warm dev server for green.

## user_requests
1. Validate Phase 3.2c.1 (Finnhub /quote integration) Session 36 log and approve PR #34 for merge.
2. Confirm the implementer's plan for Phase 3.2c.1 before they started coding (Tag icon choice + floating-point rounding).
3. Generate the strategist agent-handoff document.

## actions_taken
1a. Validated Session 36 log; confirmed quality gates and contract preservation; approved merge.
2a. Approved symbol-tied locale (en-US for USD, vi-VN for VND).
2b. Overrode the Tag icon choice from `WarningAlt` to `Information` for advisory states (better color-icon tonal agreement).
2c. Flagged floating-point gotcha: `185.42 * 100 !== 18542` in IEEE 754; required `Math.round()` to preserve integer-minor-units invariant.
3a. Created `docs/agent/` directory.
3b. Invoked the `anthropic-skills:agent-handoff` skill.
3c. Authored this handoff under the skill's schema, with strategist-role detail concentrated in `key_decisions` and `handoff`.

## files_touched
- created  docs/agent/agent-handoff.md

## key_decisions
- The strategist (Opus, this role) authors prompts and reviews implementer output. The strategist does not write production code. Exception: when the user explicitly says "implement", "code this", "do it yourself", "fix it directly" — scoped to the specific request, not standing permission. Doc-only edits (CLAUDE.md, ADRs, spec docs, handoff files) are within scope at any time.
- The implementer (Sonnet 4.6) executes prompts in a separate conversation. The strategist never types code on the implementer's behalf.
- Gemini is the off-script auditor — invited by the user (not the strategist) for tasks the strategist can't see from the conversation alone (e.g. external web-standards audits, accessibility scans). Strategist evaluates Gemini's output with the same "assume wrong unless proven right" rubric used for Copilot review comments.
- One phase = one PR = one session log entry. The strategist never queues multiple prompts ahead. Wait for the user to merge before writing the next prompt.
- Phase numbering: `X.Y` for feature phases (mapping to `docs/04_feature_spec.md` sections); `X.WN` for workflow-only phases (W1 through W6 so far, no product code); sub-phase `X.Y.N` for tight splits (Phase 2.1 + 2.2; Phase 3.1.1 was the savings-allocation hotfix sub-phase; Phase 3.2c.1 is the /quote sub-phase of /quote-+-charts).
- Implementer prompts always include "State in 3 sentences what you understand the task to be." Non-negotiable; surfaces ambiguity cheaply before code is written.
- Implementer prompts always include explicit "Out of scope" list with one-line justifications. Premature deferral prevents scope creep more reliably than after-the-fact correction.
- The canonical session-log template in `CLAUDE.md § Updating AI-PROCESS-LOG.md` requires a `### What I learned` section (Phase 1.W7 / Session 29 onward). If genuinely nothing learned, write "Nothing new — straightforward execution."
- Historical sessions are not rewritten. The no-rewrite rule was established in Phase 1.W1 / Session 19. Older sessions without "What I learned" stay as-is.
- Verify before asserting: `git fetch && git log --oneline -10 master` and `gh pr list` before recommending the next phase. A wrong-base-branch incident on PR #10 cost a recovery PR #11; the rule exists to prevent recurrence.
- The user runs Windows cmd. Not bash. Not PowerShell. Use `xcopy` / `robocopy` / `rmdir /S /Q` / `%TEMP%` when giving shell commands. Verify with the user if a command silently fails.
- `frontend-design` skill cannot be technically disabled at project scope (`skillOverrides` is not a real Claude Code setting). Behavioral ban per ADR 007 is the only effective control. Do not invoke or reference it for Flowstate UI work.

## open_threads
- [ ] Verify PR #34 (Phase 3.2c.1) merged after user signals; `git fetch && git pull origin master --ff-only` before starting the next prompt.
- [ ] Write the Phase 3.2c.2 prompt — per-asset stacked-area chart in Simulation Region B, extending the per-asset breakdown to the full 30-year timeline. Carbon Charts ships `StackedAreaChart`; data wiring already exists in `projection.scenarios[i].byAsset[asset].series[k].value`.
- [ ] Consider writing an ADR for the `react-hooks/set-state-in-effect` lint constraint and the derived-state-from-requestKey hook idiom — flagged in Session 36; shortcuts future review questions on async hooks.
- [ ] Reconcile §7.1 spec drift (header vs POST body for Finnhub key) — small spec-only PR or fold into Onboarding phase when it lands.
- [ ] Reconcile §6.5 spec drift (test-connection button enabled vs disabled) — small spec-only PR; the enabled-with-toast pattern is more honest than disabled-with-helper.
- [ ] Investigate cold-start e2e contention under 5-worker default parallelism — workflow phase if it persists; not blocking.
- [ ] Phase 4 (Reports page) is the natural feature milestone after Phase 3.2c series wraps. Spec sections 5 in `docs/04_feature_spec.md`.
- [ ] Phase 1 (Onboarding) is also outstanding — `app/onboarding/page.tsx` doesn't exist; Reset modal currently redirects to `/` instead of the spec-intended `/onboarding`.

## handoff
- tone: User communicates terse and decisive. Push back firmly when an implementer or agent gets something wrong; do not soften. Prefer decisive recommendations ("Pick X. Reason: Y.") over multi-option lists when the answer is clear. Match Windows cmd in every shell snippet — bash one-liners and PowerShell-isms will be rejected. The user is the integrator: copies prompts from this conversation, pastes to the implementer, returns with logs + PR messages. They do not expect long preamble before useful output.
- first_action: Read in order before writing any prompt or recommendation. (1) `CLAUDE.md` end-to-end — Hard Rules and the canonical log template. (2) `.claude/skills/flowstate-strategist/SKILL.md` — this is the operating manual for your role; the canonical implementer-prompt template lives here, fenced and ready to copy. (3) `PRODUCT.md` — strategic frame. (4) `DESIGN.md` — tactical map. (5) `AI-PROCESS-LOG.md` — Session Index at top, then the most recent three full session entries (immediately above the marker block). (6) `git log --oneline -10` on master. (7) `gh pr list` to see open PRs. Then state in 3 sentences what Flowstate is, what just shipped, and what is queued — and wait for the user's "go" before producing any prompt. Skim if conversation context already covers any of these; do not re-read what is already loaded.
- external_blockers: none.
- gotchas:
  - The flowstate-strategist skill at `.claude/skills/flowstate-strategist/SKILL.md` contains the full canonical implementer-prompt template. Use it verbatim as the skeleton for every implementer prompt. Eleven sections: opening frame, skills to invoke, required reading, state-3-sentences, outcomes, files, required behavior, out of scope, acceptance criteria, when done, stop. Use a four-backtick fence when the prompt contains triple-backtick code blocks (it usually does).
  - Do not over-bundle phases. Four-plus outcomes in one prompt is too much; the user has redirected on this multiple times. Split unless outcomes are tightly coupled (bug fix + the test that proves it).
  - The integration contract for `computeProjection` is locked. Phase 3.2c.2 must not modify it. If a Simulation enhancement seems to require an engine change, the answer is "no, work within the existing shape."
  - Spec docs occasionally carry arithmetic or factual errors (e.g. the teacher's "sums to 1.00" claim against the 0.90 actual sum that became ADR 008). When an implementer flags such an error, trust the implementer and verify the math; do not paper over.
  - ADR numbers: ADR 005 is `add-document-pictogram.md` (the AddDocument substitution decision). An earlier implementer claim that ADR 002 was the pictogram ADR was wrong — ADR 002 is `carbon-sass-turbopack.md`. Verify ADR cross-references with `ls docs/decisions/` before citing.
  - Copilot PR review comments: triage with the "assume wrong unless proven right" rubric. Recent track record: Session 18 rejected 4/6, Session 26 rejected 3/4, Session 36's two were both valid. Record verdicts in a session-log addendum, not a new session.
  - Gemini sessions follow the canonical log template but used a synonym in Session 35 ("What I understand and can explain" instead of "What I learned"). The Phase 1.6.3 PR included a rename for consistency. Future Gemini briefings should explicitly cite CLAUDE.md as the template source.
  - Session 35 (Gemini's settings audit) is a precedent for invoking Gemini: the user names the scope ("check web standards adherence"), Gemini investigates and proposes fixes, the user pushes the result. The strategist evaluates Gemini's output the same way as any implementer output — assume wrong until proven right, validate against the spec.
  - Floating-point arithmetic in JavaScript bites when converting major-to-minor units. Always `Math.round()` on any `priceMajor * 100` conversion when feeding `Money.amount`. Verified in Session 36.
  - `react-hooks/set-state-in-effect` lint rule is stricter than the React docs imply. Async fetch patterns that call `setState({ status: 'loading' })` synchronously in the effect body are flagged. The working idiom is derived-state-from-requestKey + only-setState-in-`.then`/`.catch` callbacks. See `src/features/simulation/useTickerQuote.ts` for the established pattern.
  - The Finnhub key must never appear in URLs, console.error messages, or any client-visible channel. POST body only, route handler forwards to Finnhub. Verify in DevTools Network tab on any change touching ticker routes.
  - The cold-start e2e contention under 5-worker parallelism is environmental, not a code regression. Reproduce only on a fresh server start; warm runs are deterministically green. Do not chase it in a code-review-grade investigation.
  - When the user asks for a doc patch (e.g. spec correction, ADR resolution), the strategist may do it directly — this is doc-only editing, within scope. When the user asks for a code change, the strategist writes a prompt; the implementer does the work. The line: code under `src/`, `app/`, `e2e/` is implementer territory; everything under `docs/`, repo-root markdown files (PRODUCT.md, DESIGN.md, AI-PROCESS-LOG.md, CLAUDE.md), and `.claude/skills/` skill content is strategist-editable.
  - When in doubt about which side of the line a task falls on, ask the user "do you want me to write the prompt or do it myself?" — they will say. The default for ambiguity should lean toward writing a prompt, not doing it directly.
