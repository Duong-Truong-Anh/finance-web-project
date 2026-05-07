# Fallow: Workflow Patterns (Flowstate subset)

Step-by-step workflows for fallow usage in Flowstate. Monorepo, CI pipeline, migration, custom plugin, and GitHub/GitLab integration patterns are in the upstream skill (fallow-rs/fallow-skills) — not vendored here.

---

## Full Project Audit

```bash
fallow dead-code --format json --quiet 2>/dev/null || true
```

Parse `total_issues` and individual arrays (`unused_files`, `unused_exports`, etc.) to understand scope.

```bash
fallow dupes --format json --quiet 2>/dev/null || true
```

```bash
fallow fix --dry-run --format json --quiet 2>/dev/null || true
# After review:
fallow fix --yes --format json --quiet 2>/dev/null || true
fallow dead-code --format json --quiet 2>/dev/null || true
```

---

## PR Dead Code Check

Check if a pull request introduces new dead code:

```bash
fallow dead-code --format json --quiet --changed-since main --fail-on-issues 2>/dev/null || true
```

Exit code 1 if the PR introduces new dead code. Exit code 0 if clean.

---

## Incremental Adoption with Baselines

For projects with existing dead code — adopt gradually without fixing everything at once.

### Save current state as baseline

```bash
fallow dead-code --format json --quiet --save-baseline fallow-baselines/dead-code.json 2>/dev/null || true
git add fallow-baselines/dead-code.json
git commit -m "chore: add fallow baseline"
```

### CI only fails on NEW issues

```bash
fallow dead-code --format json --quiet --baseline fallow-baselines/dead-code.json --fail-on-issues 2>/dev/null || true
```

### Reduce baseline over time

As you fix existing issues, regenerate the baseline:

```bash
fallow dead-code --format json --quiet --save-baseline fallow-baselines/dead-code.json 2>/dev/null || true
```

---

## Safe Auto-Fix Workflow

```bash
# 1. Preview
fallow fix --dry-run --format json --quiet 2>/dev/null || true

# 2. Review JSON `changes` array (path, action, name, line)
# 3. Apply after user confirmation
fallow fix --yes --format json --quiet 2>/dev/null || true

# 4. Verify
fallow dead-code --format json --quiet 2>/dev/null || true

# 5. Run tests
bun run test
```

---

## Production vs Full Audit

```bash
# Full (includes test/dev files and devDependencies)
fallow dead-code --format json --quiet 2>/dev/null || true

# Production only (excludes test files, checks type-only prod deps)
fallow dead-code --format json --quiet --production 2>/dev/null || true
```

---

## Debugging False Positives

```bash
fallow dead-code --format json --quiet --trace src/utils.ts:myFunction 2>/dev/null || true
fallow dead-code --format json --quiet --trace-file src/utils.ts 2>/dev/null || true
fallow dead-code --format json --quiet --trace-dependency lodash 2>/dev/null || true
```

If an export IS used but still flagged (fully dynamic import, reflection), add a suppression:

```typescript
// fallow-ignore-next-line unused-export
export const dynamicallyUsed = createHandler();
```