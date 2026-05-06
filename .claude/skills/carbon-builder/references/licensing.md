# Carbon licensing — fast reference

Carbon is **Apache License 2.0**. Copyright IBM Corp. Permissive license, but with concrete obligations.

## At a glance

| Scenario | What you must do |
|---|---|
| Use Carbon via npm (`import { Button } from '@carbon/react'`) | Add Carbon to `THIRD_PARTY_NOTICES.md`; that's it |
| Self-host IBM Plex font files | Include `OFL.txt` next to the fonts |
| Load IBM Plex from CDN (Google Fonts / IBM CDN) | Nothing extra |
| Fork/copy a Carbon source file into your repo | Keep IBM copyright header; add modification notice; add to THIRD_PARTY_NOTICES |
| Edit the forked file | Above + describe the changes in a comment block |
| Ship a fork in a public package | Above + LICENSE file in repo root + match Apache-2.0 (or compatible) |
| Use IBM logo or "IBM" in your branding | **Never** — trademark, not licensed |
| Name a package `@carbon/...` | **Never** — namespace owned by IBM |
| Brand your product as "IBM X" | **Never** — endorsement violation |
| Say "Built with Carbon" or "Uses IBM's open-source Carbon Design System" | Allowed (factual description) |

## What npm install handles for you

When you `npm install @carbon/react`:

- The Apache-2.0 LICENSE file ships in `node_modules/@carbon/react/LICENSE` ✅
- `package.json` declares `"license": "Apache-2.0"` ✅
- All source files retain `Copyright IBM Corp.` headers ✅

So Apache-2.0 § 4(a) and § 4(c) are met automatically for the deps. You only need to **attribute** the deps in your own project.

## Minimum THIRD_PARTY_NOTICES.md

```markdown
# Third-party notices

This project uses the following open-source software.

## @carbon/react
- Source: https://github.com/carbon-design-system/carbon/tree/main/packages/react
- License: Apache-2.0
- Copyright: IBM Corp.

## @carbon/web-components
- Source: https://github.com/carbon-design-system/carbon/tree/main/packages/web-components
- License: Apache-2.0
- Copyright: IBM Corp.

## @carbon/styles
- Source: https://github.com/carbon-design-system/carbon/tree/main/packages/styles
- License: Apache-2.0
- Copyright: IBM Corp.

## @carbon/icons-react
- Source: https://github.com/carbon-design-system/carbon/tree/main/packages/icons-react
- License: Apache-2.0
- Copyright: IBM Corp.

## IBM Plex (font)
- Source: https://github.com/IBM/plex
- License: SIL Open Font License 1.1
- Copyright: IBM Corp.
```

Generate this automatically with `license-checker` or `license-report`:

```bash
npx license-checker --production --json --out third_party.json
```

## Forked-file header (copy/paste)

```
/*
 * Copyright IBM Corp. {YEAR_RANGE_FROM_ORIGINAL}
 * Modifications Copyright {USER_ORG} {CURRENT_YEAR}
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Modifications:
 *   - {SHORT_BULLET_POINT_PER_CHANGE}
 */
```

## Trademark cheat sheet

**Trademarks of IBM Corp.** (never use without separate license):
- IBM
- IBM logo
- Carbon Design System name
- Carbon name in product naming
- IBM Plex name (the font itself is OFL-licensed; the *name* is a trademark)
- IBM Cloud, IBM Watson, etc. (specific product trademarks)

**OK to say:**
- "Built with Carbon Design System (IBM, Apache-2.0)"
- "This project uses IBM Plex font"
- "Carbon-styled" (descriptive)
- "Inspired by IBM Carbon"

**Not OK:**
- Calling your product "IBM Anything"
- Putting the IBM logo in the chrome
- Implying endorsement or partnership

## Patent license note

Apache-2.0 grants you a patent license from contributors. If you sue any contributor for patent infringement on the Work, your license terminates. (Informational; relevant for corporate legal teams.)

## Warranty

Carbon ships "AS IS" with no warranty. Standard for permissive open source. Don't promise your users that Carbon will work for their use case — that's their evaluation.

## When in doubt

Have a lawyer look at your `THIRD_PARTY_NOTICES.md` before you ship. The harness is not legal advice.
