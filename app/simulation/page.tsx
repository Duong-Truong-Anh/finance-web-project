import { Grid, Column } from '@carbon/react';
import { readCurrency, readTheme } from '@/app/lib/cookies-server';
import SimulationPage from '@/src/features/simulation/SimulationPage';

export default async function SimulationRoute() {
  const [currency, theme] = await Promise.all([readCurrency(), readTheme()]);
  return (
    <Grid>
      <Column sm={4} md={8} lg={16}>
        <SimulationPage initialCurrency={currency} initialTheme={theme} />
      </Column>
    </Grid>
  );
}
