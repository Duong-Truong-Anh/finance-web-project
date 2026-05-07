# ADR 006 — Condense vendored fallow skill to Flowstate-relevant subset

## Context

The fallow Agent Skill was vendored verbatim from `fallow-rs/fallow-skills` v1.0.0 in Phase 1.7 (ADR 004). The upstream skill is authored for the full fallow user base and includes documentation for features Flowstate does not and will not use:

- **Paid runtime-coverage tools** (`get_hot_paths`, `get_blast_radius`, `get_importance`, `get_cleanup_candidates`) — ADR 004 explicitly deferred these.
- **Feature-flag SDK detection** (LaunchDarkly, Statsig, Unleash, GrowthBook) — `feature-flags` rule is set to `"off"` in `.fallowrc.json`.
- **Monorepo workspace analysis** (`--workspace`, `--changed-workspaces`) — Flowstate is a single-package project.
- **MCP tools section** — `fallow-mcp` is installed but not registered; the agent uses the skill route, not MCP.
- **Node.js bindings** (`@fallow-cli/fallow-node`) — not consumed by any Flowstate code.
- **Setup and migration instructions** (`fallow init`, `fallow migrate`) — already executed in Phase 1.7; re-running would overwrite the committed `.fallowrc.json`.
- **CI pipeline recipes** (GitHub Actions, GitLab CI YAML, SARIF upload) — Flowstate has no CI pipeline; `bun run fallow:check` is the only gate.
- **Watch mode** — already forbidden by Agent Rule 7.
- **`references/patterns.md`** — 761 lines covering CI, monorepo, migration, and GitHub/GitLab integration patterns that don't apply.

User observation: `/status` showed the fallow skill contributing disproportionate token weight when triggered. Agent skills are loaded on-demand, but their full content sits in context for the duration of a session once triggered.

## Decision

Condense `SKILL.md` in-place. Keep the YAML frontmatter fields intact (same `name`, `description`, `license`) so Claude Code auto-discovers the skill on the same trigger phrases. Bump `version` to `1.0.0-flowstate` to mark the divergence from upstream.

**What was kept:**
- All 8 Agent Rules verbatim — these are the load-bearing safety rules.
- `When to Use` / `When NOT to Use` gate language — unchanged.
- Commands table trimmed to commands Flowstate actually uses: `audit`, `dead-code`, `dupes`, `fix`, `health`, `list`, `config`, `explain`.
- Full Issue Types table — all types remain discoverable even if some are `"warn"` or `"off"` in config.
- Core workflow recipes: full project audit, PR dead-code check, safe auto-fix cycle, discover project structure, debug false positives.
- Exit codes, configuration schema, inline suppression syntax.
- Key gotchas.
- Upstream pointer note at the bottom.

**What was removed:**
- Prerequisites / setup instructions.
- MCP tools section (28 lines).
- Node.js bindings section (21 lines).
- Commands for `init`, `migrate`, `flags`, `license`, `coverage`, `coverage upload-source-maps`, `schema`.
- Monorepo workflow examples from Common Workflows.
- `references/patterns.md` trimmed from 761 lines to ~100 covering only: full-project audit, PR dead-code check, incremental baselines, safe auto-fix, production vs full audit, debugging false positives.

**Line counts:**
- `SKILL.md` before: 382 lines → after: 213 lines (44.2% reduction).
- `references/patterns.md` before: 761 lines → after: ~100 lines.

## Consequences

- **Trigger behavior unchanged.** The `description` field and `When to Use` language are identical to upstream, so auto-discovery fires on the same phrases.
- **All 8 safety rules intact.** Any future implementer reading the skill will apply `--format json --quiet 2>/dev/null || true` and dry-run-before-fix correctly.
- **Manual reconcile required when fallow ships new free-tier features.** The condensed copy does not receive upstream updates automatically. When a new free-tier command or flag is needed, re-vendor selectively: copy only the relevant section from the upstream SKILL.md and add it to the Commands table or Common Workflows here.
- **Upstream pointer documented.** The bottom of the condensed SKILL.md notes which feature categories are omitted and directs future maintainers to fallow-rs/fallow-skills.
- **ADR 004 is the adoption record.** This ADR records only the condensation decision; the rationale for adopting fallow in the first place remains in ADR 004.
