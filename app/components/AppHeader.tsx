'use client';

import { Header, HeaderName } from '@carbon/react';

export default function AppHeader() {
  return (
    <Header aria-label="Flowstate">
      <HeaderName href="/" prefix="Flow">state</HeaderName>
    </Header>
  );
}
