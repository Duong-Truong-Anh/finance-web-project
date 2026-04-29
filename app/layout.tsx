import type { Metadata } from 'next';
import { Theme } from '@carbon/react';
import AppShell from './components/AppShell';
import { readTheme, readCurrency } from './lib/cookies-server';
// Carbon base styles: imported as pre-compiled CSS to work around Turbopack's
// inability to resolve relative @forward paths in @carbon/styles/index.scss.
// See docs/decisions/002_carbon-sass-turbopack.md
import '@carbon/styles/css/styles.css';
import './globals.scss';

export const metadata: Metadata = {
  title: 'Flowstate',
  description: 'Personal cash flow and long-term investment simulator',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await readTheme();
  const currency = await readCurrency();
  // cds--{theme} on <html> sets the correct CSS custom properties at root scope
  // on the first HTML byte, preventing a flash of wrong theme on page load.
  // <Theme> inside <body> provides the React context boundary for Carbon components.
  const themeClass = `cds--${theme}` as const;

  return (
    <html lang="en" className={themeClass}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <Theme theme={theme}>
          <AppShell theme={theme} currency={currency}>
            {children}
          </AppShell>
        </Theme>
      </body>
    </html>
  );
}
