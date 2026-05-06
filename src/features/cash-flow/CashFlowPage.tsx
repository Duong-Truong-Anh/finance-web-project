'use client';
import { useCallback, useState } from 'react';
import {
  Button,
  DataTableSkeleton,
  InlineNotification,
  Stack,
} from '@carbon/react';
import { Add, Upload } from '@carbon/icons-react';
import { useTransactions } from './useTransactions';
import { useFx } from './useFx';
import TransactionModal, { type ModalState } from './TransactionModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import CashFlowTabs from './CashFlowTabs';
import EmptyState from './EmptyState';
import ExportCsvButton from './ExportCsvButton';
import ImportCsvModal from './ImportCsvModal';
import type { Transaction } from '@/src/lib/transactions/schema';
import type { Currency, FxRateSnapshot } from '@/src/lib/currency/types';
import type { Theme } from '@/src/lib/settings/repository';
import { aggregateByMonth } from '@/src/lib/aggregation/aggregate-by-month';
import CashFlowComboChart from '@/src/components/charts/CashFlowComboChart';

// Fallback FX used only when live rates are loading or errored; chart degrades gracefully.
const IDENTITY_FX: FxRateSnapshot = { base: 'USD', rates: { VND: 25000, USD: 1 }, fetchedAt: '1970-01-01T00:00:00.000Z' };

type DeleteState = { open: false } | { open: true; ids: string[] };

interface Props {
  initialCurrency: Currency;
  initialTheme: Theme;
}

export default function CashFlowPage({ initialCurrency, initialTheme }: Props) {
  const { state, create, update, remove, removeMany, addMany } = useTransactions();
  const fxState = useFx();

  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });
  const [importOpen, setImportOpen] = useState(false);

  const openCreate = useCallback(() => setModalState({ open: true, mode: 'create' }), []);
  const openEdit = useCallback(
    (tx: Transaction) => setModalState({ open: true, mode: 'edit', transaction: tx }),
    [],
  );
  const closeModal = useCallback(() => setModalState({ open: false }), []);

  const openDelete = useCallback((ids: string[]) => setDeleteState({ open: true, ids }), []);
  const closeDelete = useCallback(() => setDeleteState({ open: false }), []);

  const openImport = useCallback(() => setImportOpen(true), []);
  const closeImport = useCallback(() => setImportOpen(false), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteState.open) return;
    const { ids } = deleteState;
    closeDelete();
    if (ids.length === 1) {
      await remove(ids[0]);
    } else {
      await removeMany(ids);
    }
  }, [deleteState, closeDelete, remove, removeMany]);

  const handleEditById = useCallback(
    (id: string) => {
      if (state.status !== 'ready') return;
      const tx = state.transactions.find((t) => t.id === id);
      if (tx) openEdit(tx);
    },
    [state, openEdit],
  );

  const deleteCount = deleteState.open ? deleteState.ids.length : 0;

  const modalKey = !modalState.open
    ? 'closed'
    : modalState.mode === 'edit'
      ? `edit-${modalState.transaction.id}`
      : 'create';

  const transactions = state.status === 'ready' ? state.transactions : [];

  return (
    <Stack gap={7}>
      <h1 className="cds--type-productive-heading-04">Cash flow</h1>

      <div style={{ display: 'flex', gap: 'var(--cds-spacing-03)', marginBlockEnd: 'var(--cds-spacing-05)' }}>
        <Button kind="primary" renderIcon={Add} onClick={openCreate}>
          Add transaction
        </Button>
        <ExportCsvButton transactions={transactions} />
        <Button kind="tertiary" renderIcon={Upload} onClick={openImport}>
          Import CSV
        </Button>
      </div>

      {fxState.status === 'error' && (
        <InlineNotification
          kind="warning"
          lowContrast
          hideCloseButton
          title="Live exchange rates are unavailable."
          subtitle="Showing amounts in stored currency."
        />
      )}

      <div>
        {state.status === 'loading' && (
          <DataTableSkeleton
            headers={[
              { header: 'Date' },
              { header: 'Kind' },
              { header: 'Name' },
              { header: 'Notes' },
              { header: 'Amount' },
              { header: '' },
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
          <CashFlowTabs
            transactions={state.transactions}
            displayCurrency={initialCurrency}
            fxState={fxState}
            onEdit={handleEditById}
            onDelete={(id) => openDelete([id])}
            onBulkDelete={openDelete}
          />
        )}
      </div>

      {state.status === 'ready' && state.transactions.length > 0 && (
        <CashFlowComboChart
          months={aggregateByMonth(
            state.transactions,
            initialCurrency,
            fxState.status === 'ready' ? fxState.fx : IDENTITY_FX,
          )}
          displayCurrency={initialCurrency}
          theme={initialTheme}
        />
      )}

      <TransactionModal
        key={modalKey}
        modalState={modalState}
        onClose={closeModal}
        onCreate={create}
        onUpdate={update}
        initialCurrency={initialCurrency}
      />

      <DeleteConfirmModal
        open={deleteState.open}
        count={deleteCount}
        onCancel={closeDelete}
        onConfirm={handleConfirmDelete}
      />

      <ImportCsvModal
        open={importOpen}
        onClose={closeImport}
        addMany={addMany}
      />
    </Stack>
  );
}
