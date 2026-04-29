'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SideNavDivider,
  SideNavItems,
  SideNavLink,
} from '@carbon/react';
import {
  ArrowsVertical,
  ChartLineSmooth,
  Dashboard,
  Report,
  Settings,
} from '@carbon/icons-react';

const NAV_ITEMS = [
  { href: '/',           label: 'Dashboard',  Icon: Dashboard       },
  { href: '/cash-flow',  label: 'Cash Flow',  Icon: ArrowsVertical  },
  { href: '/simulation', label: 'Simulation', Icon: ChartLineSmooth },
  { href: '/reports',    label: 'Reports',    Icon: Report          },
] as const;

export default function AppSideNav() {
  const pathname = usePathname();

  return (
    <SideNavItems>
      {NAV_ITEMS.map(({ href, label, Icon }) => (
        <SideNavLink
          key={href}
          // `as` swaps the underlying anchor for a Next Link so navigation is
          // client-side (no full reload). Confirmed pattern for @carbon/react 1.x.
          // See docs/decisions/003_sidenav-next-link.md.
          as={Link}
          href={href}
          renderIcon={Icon}
          isActive={pathname === href}
          aria-current={pathname === href ? 'page' : undefined}
        >
          {label}
        </SideNavLink>
      ))}

      <SideNavDivider />

      <SideNavLink
        as={Link}
        href="/settings"
        renderIcon={Settings}
        isActive={pathname === '/settings'}
        aria-current={pathname === '/settings' ? 'page' : undefined}
      >
        Settings
      </SideNavLink>
    </SideNavItems>
  );
}
