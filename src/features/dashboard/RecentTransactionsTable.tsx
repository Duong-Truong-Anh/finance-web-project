'use client';
import Link from 'next/link';
import {
  Button,
  DataTable,
  SkeletonText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  Tag,
} from '@carbon/react';
import { ArrowUp, ArrowDown } from '@carbon/icons-react';
import type { Transaction } from '@/src/lib/transactions/schema';
import type { Currency } from '@/src/lib/currency/types';
import type { FxState } from '@/src/features/cash-flow/useFx';
import { convert } from '@/src/lib/currency/convert';
import { format } from '@/src/lib/currency/format';

const HEADERS = [
  { key: 'occurredOn', header: 'Date' },
  { key: 'kind', header: 'Kind' },
  { key: 'name', header: 'Name' },
  { key: 'amount', header: 'Amount' },
] as const;

function localeFor(currency: Currency): 'vi-VN' | 'en-US' {
  return currency === 'VND' ? 'vi-VN' : 'en-US';
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

function AmountCell({
  tx,
  displayCurrency,
  fxState,
}: {
  tx: Transaction;
  displayCurrency: Currency;
  fxState: FxState;
}) {
  if (fxState.status === 'loading') {
    return <SkeletonText width="60px" />;
  }

  const displayMoney =
    fxState.status === 'ready' ? convert(tx.amount, displayCurrency, fxState.fx) : tx.amount;

  const formatted = format(displayMoney, localeFor(displayMoney.currency));
  const isExpense = tx.kind === 'expense';

  return (
    <span
      style={{
        fontVariantNumeric: 'tabular-nums',
        color: isExpense ? 'var(--cds-support-error)' : undefined,
      }}
    >
      {isExpense ? '−' : ''}
      {formatted}
    </span>
  );
}

const DATE_FMT = new Intl.DateTimeFormat('en-CA');

interface Props {
  transactions: Transaction[];
  displayCurrency: Currency;
  fxState: FxState;
}

export default function RecentTransactionsTable({ transactions, displayCurrency, fxState }: Props) {
  // Sort by occurredOn descending, take first 5
  const recent = [...transactions]
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))
    .slice(0, 5);

  const txById = new Map(recent.map((tx) => [tx.id, tx]));

  const rows = recent.map((tx) => ({
    id: tx.id,
    occurredOn: DATE_FMT.format(new Date(`${tx.occurredOn}T00:00:00`)),
    kind: tx.kind,
    name: tx.name,
    amount: '',
  }));

  return (
    <TableContainer title="Recent transactions">
      <TableToolbar>
        <TableToolbarContent>
          <Button as={Link} href="/cash-flow" kind="ghost" size="sm">
            View all →
          </Button>
        </TableToolbarContent>
      </TableToolbar>

      <DataTable rows={rows} headers={HEADERS as unknown as { key: string; header: string }[]} size="sm">
        {({ rows: tableRows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header) => {
                  const { key: _k, ...hProps } = getHeaderProps({ header });
                  return (
                    <TableHeader key={header.key} {...hProps}>
                      {header.key === 'amount' ? (
                        <span style={{ display: 'block', textAlign: 'end' }}>{header.header}</span>
                      ) : (
                        header.header
                      )}
                    </TableHeader>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.map((row) => {
                const origTx = txById.get(row.id);
                const { key: _k, ...rProps } = getRowProps({ row });
                return (
                  <TableRow key={row.id} {...rProps}>
                    {row.cells.map((cell) => {
                      const headerKey = (cell as { info: { header: string } }).info.header;
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
                            <AmountCell
                              tx={origTx}
                              displayCurrency={displayCurrency}
                              fxState={fxState}
                            />
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={cell.id}>
                          {typeof cell.value === 'string' ? cell.value : ''}
                        </TableCell>
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
