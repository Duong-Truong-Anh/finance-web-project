'use client';
import { useMemo } from 'react';
import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from '@carbon/react';
import { ArrowUp, ArrowDown } from '@carbon/icons-react';
import type { Transaction } from '@/src/lib/transactions/schema';
import type { Money } from '@/src/lib/currency/types';

const HEADERS = [
  { key: 'occurredOn', header: 'Date' },
  { key: 'kind', header: 'Kind' },
  { key: 'name', header: 'Name' },
  { key: 'notes', header: 'Notes' },
  { key: 'amount', header: 'Amount' },
] as const;

type HeaderKey = (typeof HEADERS)[number]['key'];

interface Props {
  kind: 'all' | 'income' | 'expense';
  transactions: Transaction[];
}

function KindTag({ txKind }: { txKind: 'income' | 'expense' }) {
  return txKind === 'income' ? (
    <Tag type="green" renderIcon={ArrowUp}>
      Income
    </Tag>
  ) : (
    <Tag type="red" renderIcon={ArrowDown}>
      Expense
    </Tag>
  );
}

function AmountCell({ tx }: { tx: Transaction }) {
  const money = tx.amount as unknown as Money;
  const isExpense = tx.kind === 'expense';
  return (
    <span
      style={{
        fontVariantNumeric: 'tabular-nums',
        color: isExpense ? 'var(--cds-support-error)' : undefined,
      }}
    >
      {isExpense ? '−' : ''}
      {money.amount} {money.currency}
    </span>
  );
}

const DATE_FMT = new Intl.DateTimeFormat('en-CA');

export default function TransactionTable({ kind, transactions }: Props) {
  const filtered = useMemo(
    () =>
      kind === 'all'
        ? transactions
        : transactions.filter((tx) => tx.kind === kind),
    [kind, transactions],
  );

  const txById = useMemo(
    () => new Map(filtered.map((tx) => [tx.id, tx])),
    [filtered],
  );

  const rows = useMemo(
    () =>
      filtered.map((tx) => ({
        id: tx.id,
        occurredOn: DATE_FMT.format(new Date(`${tx.occurredOn}T00:00:00`)),
        kind: tx.kind,
        name: tx.name,
        notes: tx.notes ?? '',
        amount: tx.amount,
      })),
    [filtered],
  );

  if (filtered.length === 0) {
    return (
      <p
        className="cds--type-body-01"
        style={{ padding: 'var(--cds-spacing-05)', color: 'var(--cds-text-secondary)' }}
      >
        {kind === 'income'
          ? 'No income transactions yet.'
          : kind === 'expense'
            ? 'No expense transactions yet.'
            : 'No transactions yet.'}
      </p>
    );
  }

  return (
    <TableContainer>
      <DataTable rows={rows} headers={HEADERS as unknown as { key: string; header: string }[]}>
        {({ rows: tableRows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader
                    {...getHeaderProps({ header })}
                    key={header.key}
                    style={
                      header.key === 'amount'
                        ? ({ textAlign: 'right' } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.map((row) => {
                const origTx = txById.get(row.id);
                return (
                  <TableRow {...getRowProps({ row })} key={row.id}>
                    {row.cells.map((cell) => {
                      const headerKey = (cell as { info: { header: HeaderKey } }).info.header;
                      if (headerKey === 'kind' && origTx) {
                        return (
                          <TableCell key={cell.id}>
                            <KindTag txKind={origTx.kind} />
                          </TableCell>
                        );
                      }
                      if (headerKey === 'amount' && origTx) {
                        return (
                          <TableCell key={cell.id} style={{ textAlign: 'right' }}>
                            <AmountCell tx={origTx} />
                          </TableCell>
                        );
                      }
                      if (headerKey === 'notes') {
                        const notes = (cell.value as string) ?? '';
                        return (
                          <TableCell key={cell.id}>
                            {notes.length > 60 ? `${notes.slice(0, 60)}…` : notes}
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={cell.id}>{cell.value as string}</TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataTable>
    </TableContainer>
  );
}
