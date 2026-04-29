import { Grid, Column } from '@carbon/react';
import { readCurrency } from '@/app/lib/cookies-server';
import CashFlowPage from '@/src/features/cash-flow/CashFlowPage';

export default async function CashFlowRoute() {
  const currency = await readCurrency();
  return (
    <Grid>
      <Column sm={4} md={8} lg={16}>
        <CashFlowPage initialCurrency={currency} />
      </Column>
    </Grid>
  );
}
