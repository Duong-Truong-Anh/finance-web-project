'use client';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import TransactionTable from './TransactionTable';
import type { Transaction } from '@/src/lib/transactions/schema';

interface Props {
  transactions: Transaction[];
}

export default function CashFlowTabs({ transactions }: Props) {
  return (
    <Tabs>
      <TabList aria-label="Filter transactions">
        <Tab>All</Tab>
        <Tab>Income</Tab>
        <Tab>Expenses</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <TransactionTable kind="all" transactions={transactions} />
        </TabPanel>
        <TabPanel>
          <TransactionTable kind="income" transactions={transactions} />
        </TabPanel>
        <TabPanel>
          <TransactionTable kind="expense" transactions={transactions} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
