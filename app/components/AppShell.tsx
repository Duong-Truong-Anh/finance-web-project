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

export default function AppShell({ children }: { children: React.ReactNode }) {
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
              {/* Currency · Theme · Settings actions wired in Phase 0.4 */}
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
