'use client';
import { useMemo } from 'react';
import {
  DataTable,
  OverflowMenu,
  OverflowMenuItem,
  SkeletonText,
  Table,
  TableBatchAction,
  TableBatchActions,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableSelectAll,
  TableSelectRow,
  TableToolbar,
  TableToolbarContent,
  Tag,
} from '@carbon/react';
import { ArrowUp, ArrowDown, TrashCan } from '@carbon/icons-react';
import type { Transaction } from '@/src/lib/transactions/schema';
import type { Currency } from '@/src/lib/currency/types';
import type { FxState } from './useFx';
import { convert } from '@/src/lib/currency/convert';
import { format } from '@/src/lib/currency/format';

const HEADERS = [
  { key: 'occurredOn', header: 'Date' },
  { key: 'kind', header: 'Kind' },
  { key: 'name', header: 'Name' },
  { key: 'notes', header: 'Notes' },
  { key: 'amount', header: 'Amount' },
] as const;

type HeaderKey = (typeof HEADERS)[number]['key'];

function localeFor(currency: Currency): 'vi-VN' | 'en-US' {
  return currency === 'VND' ? 'vi-VN' : 'en-US';
}

interface Props {
  kind: 'all' | 'income' | 'expense';
  transactions: Transaction[];
  displayCurrency: Currency;
  fxState: FxState;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
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
  const isExpense = tx.kind === 'expense';

  if (fxState.status === 'loading') {
    return <SkeletonText width="60px" />;
  }

  const displayMoney =
    fxState.status === 'ready'
      ? convert(tx.amount, displayCurrency, fxState.fx)
      : tx.amount;

  const formatted = format(displayMoney, localeFor(displayMoney.currency));

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

export default function TransactionTable({
  kind,
  transactions,
  displayCurrency,
  fxState,
  onEdit,
  onDelete,
  onBulkDelete,
}: Props) {
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
        amount: '',
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
        {({
          rows: tableRows,
          headers,
          getTableProps,
          getHeaderProps,
          getRowProps,
          getSelectionProps,
          getBatchActionProps,
          selectedRows,
        }) => {
          const batchProps = getBatchActionProps();
          return (
            <>
              <TableToolbar>
                <TableBatchActions {...batchProps}>
                  <TableBatchAction
                    renderIcon={TrashCan}
                    iconDescription="Delete selected"
                    onClick={() => onBulkDelete(selectedRows.map((r) => r.id))}
                  >
                    Delete
                  </TableBatchAction>
                </TableBatchActions>
                {/* Empty content area keeps toolbar height consistent */}
                <TableToolbarContent aria-hidden={batchProps.shouldShowBatchActions} />
              </TableToolbar>

              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    <TableSelectAll {...getSelectionProps()} />
                    {headers.map((header) => {
                      const { key: _hKey, ...headerProps } = getHeaderProps({ header });
                      return (
                        <TableHeader key={header.key} {...headerProps}>
                          {header.key === 'amount' ? (
                            <span style={{ display: 'block', textAlign: 'end' }}>
                              {header.header}
                            </span>
                          ) : (
                            header.header
                          )}
                        </TableHeader>
                      );
                    })}
                    {/* No visible header text; each OverflowMenu carries its own aria-label */}
                    <TableHeader key="actions-header" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableRows.map((row) => {
                    const origTx = txById.get(row.id);
                    const { key: _rKey, ...rowProps } = getRowProps({ row });
                    return (
                      <TableRow key={row.id} {...rowProps}>
                        <TableSelectRow {...getSelectionProps({ row })} />
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
                                <AmountCell
                                  tx={origTx}
                                  displayCurrency={displayCurrency}
                                  fxState={fxState}
                                />
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
                            <TableCell key={cell.id}>{typeof cell.value === 'string' ? cell.value : ''}</TableCell>
                          );
                        })}
                        <TableCell key={`${row.id}-actions`}>
                          <OverflowMenu
                            aria-label={`Actions for ${origTx?.name ?? row.id}`}
                            flipped
                            size="sm"
                          >
                            <OverflowMenuItem
                              itemText="Edit"
                              onClick={() => onEdit(row.id)}
                            />
                            <OverflowMenuItem
                              itemText="Delete"
                              onClick={() => onDelete(row.id)}
                              hasDivider
                              isDelete
                            />
                          </OverflowMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          );
        }}
      </DataTable>
    </TableContainer>
  );
}
