import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from 'next/font/google';
import { Theme } from '@carbon/react';
import AppShell from './components/AppShell';
import { readTheme, readCurrency } from './lib/cookies-server';
// Carbon base styles: imported as pre-compiled CSS to work around Turbopack's
// inability to resolve relative @forward paths in @carbon/styles/index.scss.
// See docs/decisions/002_carbon-sass-turbopack.md
import '@carbon/styles/css/styles.css';
import '@carbon/charts/styles.css';
import './globals.scss';

// next/font/google downloads fonts at build time and serves them from /_next/static/media/.
// The `variable` option injects CSS custom properties on the element that receives the class.
// globals.scss then overrides Carbon's hardcoded body font-family to use these variables.
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});
const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-serif',
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
  const fontClasses = [
    ibmPlexSans.variable,
    ibmPlexMono.variable,
    ibmPlexSerif.variable,
  ].join(' ');

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
