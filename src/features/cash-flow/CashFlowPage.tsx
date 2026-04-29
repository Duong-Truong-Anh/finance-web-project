'use client';
import { useCallback, useState } from 'react';
import { Button, DataTableSkeleton, InlineNotification, Stack } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import { useTransactions } from './useTransactions';
import TransactionModal, { type ModalState } from './TransactionModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import CashFlowTabs from './CashFlowTabs';
import EmptyState from './EmptyState';
import type { Transaction } from '@/src/lib/transactions/schema';
import type { Currency } from '@/src/lib/currency/types';

type DeleteState = { open: false } | { open: true; ids: string[] };

interface Props {
  initialCurrency: Currency;
}

export default function CashFlowPage({ initialCurrency }: Props) {
  const { state, create, update, remove, removeMany } = useTransactions();

  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });

  const openCreate = useCallback(() => setModalState({ open: true, mode: 'create' }), []);
  const openEdit = useCallback(
    (tx: Transaction) => setModalState({ open: true, mode: 'edit', transaction: tx }),
    [],
  );
  const closeModal = useCallback(() => setModalState({ open: false }), []);

  const openDelete = useCallback((ids: string[]) => setDeleteState({ open: true, ids }), []);
  const closeDelete = useCallback(() => setDeleteState({ open: false }), []);

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

  // Resolve the transaction object for the edit handler passed to tabs.
  // The table passes an id; we look it up from state.
  const handleEditById = useCallback(
    (id: string) => {
      if (state.status !== 'ready') return;
      const tx = state.transactions.find((t) => t.id === id);
      if (tx) openEdit(tx);
    },
    [state, openEdit],
  );

  const deleteCount = deleteState.open ? deleteState.ids.length : 0;

  // Key drives remount of TransactionModal so useState initializers pick up
  // the correct pre-fill values without setState-in-effect.
  const modalKey = !modalState.open
    ? 'closed'
    : modalState.mode === 'edit'
      ? `edit-${modalState.transaction.id}`
      : 'create';

  return (
    <Stack gap={7}>
      <h1 className="cds--type-productive-heading-04">Cash flow</h1>

      <Button kind="primary" renderIcon={Add} onClick={openCreate}>
        Add transaction
      </Button>

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
            onEdit={handleEditById}
            onDelete={(id) => openDelete([id])}
            onBulkDelete={openDelete}
          />
        )}
      </div>

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
    </Stack>
  );
}
