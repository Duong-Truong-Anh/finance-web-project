import type { Metadata } from 'next';
import { Theme } from '@carbon/react';
import AppShell from './components/AppShell';
// Carbon base styles: imported as pre-compiled CSS to work around Turbopack's
// inability to resolve relative @forward paths in @carbon/styles/index.scss.
// See docs/decisions/002_carbon-sass-turbopack.md
import '@carbon/styles/css/styles.css';
import './globals.scss';

export const metadata: Metadata = {
  title: 'Flowstate',
  description: 'Personal cash flow and long-term investment simulator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // cds--g90 on <html> sets g90 CSS custom properties at root scope so
    // var(--cds-background) resolves correctly on <body> (tokens cascade down).
    // <Theme theme="g90"> provides the React context boundary for Carbon components.
    <html lang="en" className="cds--g90">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <Theme theme="g90">
          <AppShell>{children}</AppShell>
        </Theme>
      </body>
    </html>
  );
}
