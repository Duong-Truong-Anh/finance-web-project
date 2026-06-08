import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { Theme } from '@carbon/react';
import AppShell from './components/AppShell';
import { readTheme, readCurrency } from './lib/cookies-server';
// Carbon base styles: imported as pre-compiled CSS to work around Turbopack's
// inability to resolve relative @forward paths in @carbon/styles/index.scss.
// See docs/decisions/002_carbon-sass-turbopack.md
import '@carbon/styles/css/styles.css';
import '@carbon/charts/styles.css';
import './globals.scss';

// next/font/google downloads fonts at build time, self-hosts them under
// /_next/static/media/, and auto-injects <link rel="preload"> for fonts used in
// the root layout. Weights are pruned to what Carbon's productive type tokens
// actually consume (300 for productive-heading-05, 400 for body/heading-03/04,
// 600 for heading-01/02). Plex Serif is dropped entirely — zero usages.
// `display: 'optional'` on Sans eliminates the visible swap from system fallback
// to Plex on cold load: if Plex isn't ready in ~100ms it stays on fallback for
// the session and downloads in the background for next time. CLS win.
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-ibm-plex-sans',
  display: 'optional',
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

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
  const fontClasses = [ibmPlexSans.variable, ibmPlexMono.variable].join(' ');

  return (
    <html lang="en" className={`${themeClass} ${fontClasses}`}>
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
