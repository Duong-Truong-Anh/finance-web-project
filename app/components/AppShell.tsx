'use client';

import {
  Content,
  Header,
  HeaderContainer,
  HeaderGlobalBar,
  HeaderMenuButton,
  HeaderName,
  SideNav,
  SkipToContent,
} from '@carbon/react';
import AppSideNav from './AppSideNav';
import ThemeSwitcher from './ThemeSwitcher';
import CurrencySwitcher from './CurrencySwitcher';
import SettingsLink from './SettingsLink';
import type { Theme } from '@/src/lib/settings/repository';
import type { Currency } from '@/src/lib/currency/types';

interface AppShellProps {
  children: React.ReactNode;
  theme: Theme;
  currency: Currency;
}

export default function AppShell({ children, theme, currency }: AppShellProps) {
  return (
    <HeaderContainer
      render={({ isSideNavExpanded, onClickSideNavExpand }) => (
        <>
          <Header aria-label="Flowstate">
            <SkipToContent />
            <HeaderMenuButton
              aria-label={isSideNavExpanded ? 'Close menu' : 'Open menu'}
              onClick={onClickSideNavExpand}
              isActive={isSideNavExpanded}
            />
            <HeaderName href="/" prefix="Flow">
              state
            </HeaderName>
            <HeaderGlobalBar>
              <CurrencySwitcher current={currency} />
              <ThemeSwitcher current={theme} />
              <SettingsLink />
            </HeaderGlobalBar>
          </Header>
          <SideNav
            aria-label="Primary navigation"
            expanded={isSideNavExpanded}
            isPersistent={false}
          >
            <AppSideNav />
          </SideNav>
          <Content>{children}</Content>
        </>
      )}
    />
  );
}
