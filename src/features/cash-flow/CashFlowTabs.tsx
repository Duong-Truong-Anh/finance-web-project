'use client';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import TransactionTable from './TransactionTable';
import type { Transaction } from '@/src/lib/transactions/schema';

interface Props {
  transactions: Transaction[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
}

export default function CashFlowTabs({ transactions, onEdit, onDelete, onBulkDelete }: Props) {
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
            onEdit={onEdit}
            onDelete={onDelete}
            onBulkDelete={onBulkDelete}
          />
        </TabPanel>
        <TabPanel>
          <TransactionTable
            kind="income"
            transactions={transactions}
            onEdit={onEdit}
            onDelete={onDelete}
            onBulkDelete={onBulkDelete}
          />
        </TabPanel>
        <TabPanel>
          <TransactionTable
            kind="expense"
            transactions={transactions}
            onEdit={onEdit}
            onDelete={onDelete}
            onBulkDelete={onBulkDelete}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
