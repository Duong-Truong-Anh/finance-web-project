# ADR 003 — SideNavLink + Next.js Link Integration

## Context

Carbon's `<SideNavLink>` renders a plain `<a>` anchor by default. In a Next.js App Router project, clicking a plain `<a>` causes a full page reload, bypassing the client-side router and losing scroll position, prefetch, and the soft-navigation UX.

Two patterns are available in `@carbon/react@1.x`:

1. **`as` prop** — `<SideNavLink as={Link} href="/route">`. Carbon passes through extra props to the underlying element, so `Next/Link`'s prefetch and client navigation fire. This is the documented pattern in Carbon's own Next.js examples.
2. **Inner `<Link>` child** — render `<SideNavLink><Link href="/route">Label</Link></SideNavLink>`. Carbon wraps the child in its own `<a>`, producing nested anchors (invalid HTML).

A third option — a custom wrapper component that re-exports a styled `<Link>` — was considered but rejected as unnecessary complexity.

## Decision

Use the `as={Link}` prop pattern (`import Link from 'next/link'`). Applied in `app/components/AppSideNav.tsx`.

## Consequences

- Navigation between all five routes is client-side (no full reload). Confirmed in dev with network tab: subsequent route navigations produce no document request.
- Active-link state is computed via `usePathname()` and passed as `isActive` + `aria-current="page"` — both needed because Carbon's built-in active styling uses the class prop, while screen readers use the ARIA attribute.
- If `@carbon/react` ever removes the `as` prop, the fix is a one-line change to a wrapper component.
- No third-party routing library added; zero bundle-size impact beyond what Next.js already ships.
