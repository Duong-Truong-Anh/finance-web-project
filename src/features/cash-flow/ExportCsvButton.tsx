'use client';
import { Button } from '@carbon/react';
import { Download } from '@carbon/icons-react';
import type { Transaction } from '@/src/lib/transactions/schema';
import { serializeCsv } from '@/src/lib/csv/serialize';

interface Props {
  transactions: Transaction[];
}

export default function ExportCsvButton({ transactions }: Props) {
  function handleExport() {
    const csv = serializeCsv(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowstate-cashflow-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      kind="ghost"
      renderIcon={Download}
      onClick={handleExport}
      disabled={transactions.length === 0}
    >
      Export CSV
    </Button>
  );
}
