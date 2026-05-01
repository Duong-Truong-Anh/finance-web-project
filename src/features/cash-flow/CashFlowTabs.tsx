'use client';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import TransactionTable from './TransactionTable';
import type { Transaction } from '@/src/lib/transactions/schema';
import type { Currency } from '@/src/lib/currency/types';
import type { FxState } from './useFx';

interface Props {
  transactions: Transaction[];
  displayCurrency: Currency;
  fxState: FxState;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
}

export default function CashFlowTabs({
  transactions,
  displayCurrency,
  fxState,
  onEdit,
  onDelete,
  onBulkDelete,
}: Props) {
  return (
    <Tabs>
      <TabList aria-label="Filter transactions">
        <Tab>All</Tab>
        <Tab>Income</Tab>
        <Tab>Expenses</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <TransactionTable
            kind="all"
            transactions={transactions}
            displayCurrency={displayCurrency}
            fxState={fxState}
            onEdit={onEdit}
            onDelete={onDelete}
            onBulkDelete={onBulkDelete}
          />
        </TabPanel>
        <TabPanel>
          <TransactionTable
            kind="income"
            transactions={transactions}
            displayCurrency={displayCurrency}
            fxState={fxState}
            onEdit={onEdit}
            onDelete={onDelete}
            onBulkDelete={onBulkDelete}
          />
        </TabPanel>
        <TabPanel>
          <TransactionTable
            kind="expense"
            transactions={transactions}
            displayCurrency={displayCurrency}
            fxState={fxState}
            onEdit={onEdit}
            onDelete={onDelete}
            onBulkDelete={onBulkDelete}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
