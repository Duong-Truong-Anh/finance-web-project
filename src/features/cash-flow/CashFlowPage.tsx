'use client';
import { DataTableSkeleton, InlineNotification, Stack } from '@carbon/react';
import { useTransactions } from './useTransactions';
import AddTransactionButton from './AddTransactionButton';
import CashFlowTabs from './CashFlowTabs';
import EmptyState from './EmptyState';
import type { Currency } from '@/src/lib/currency/types';

interface Props {
  initialCurrency: Currency;
}

export default function CashFlowPage({ initialCurrency }: Props) {
  const { state, create } = useTransactions();

  return (
    // Stack provides the page-section vertical rhythm (spacing-07 = 32px)
    // inside the <Column lg={16}> owned by the Server Component route.
    <Stack gap={7}>
      <h1 className="cds--type-productive-heading-04">Cash flow</h1>

      <AddTransactionButton create={create} initialCurrency={initialCurrency} />

      <div>
        {state.status === 'loading' && (
          <DataTableSkeleton
            headers={[
              { header: 'Date' },
              { header: 'Kind' },
              { header: 'Name' },
              { header: 'Notes' },
              { header: 'Amount' },
            ]}
            rowCount={3}
            showToolbar={false}
          />
        )}
        {state.status === 'error' && (
          <InlineNotification
            kind="error"
            title="Failed to load transactions"
            subtitle={state.error.message}
          />
        )}
        {state.status === 'ready' && state.transactions.length === 0 && <EmptyState />}
        {state.status === 'ready' && state.transactions.length > 0 && (
          <CashFlowTabs transactions={state.transactions} />
        )}
      </div>
    </Stack>
  );
}
