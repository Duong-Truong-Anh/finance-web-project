import { Grid, Column } from '@carbon/react';
import { readCurrency, readTheme } from '@/app/lib/cookies-server';
import DashboardPage from '@/src/features/dashboard/DashboardPage';

export default async function DashboardRoute() {
  const [currency, theme] = await Promise.all([readCurrency(), readTheme()]);
  return (
    <Grid>
      <Column sm={4} md={8} lg={16}>
        <DashboardPage initialCurrency={currency} initialTheme={theme} />
      </Column>
    </Grid>
  );
}
