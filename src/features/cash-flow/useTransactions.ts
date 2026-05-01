'use client';
import { useEffect, useState, useCallback } from 'react';
import { createLocalStorageTransactionRepository } from '@/src/lib/transactions/local-storage-repository';
import type { Transaction, TransactionInput } from '@/src/lib/transactions/schema';

type State =
  | { status: 'loading' }
  | { status: 'ready'; transactions: Transaction[] }
  | { status: 'error'; error: Error };

export function useTransactions() {
  const [state, setState] = useState<State>({ status: 'loading' });
  // Revision counter: incrementing causes the load effect to re-run.
  // This avoids calling setState directly inside the effect body (react-hooks/set-state-in-effect).
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => setRevision((r) => r + 1), []);

  useEffect(() => {
    let active = true;
    const repo = createLocalStorageTransactionRepository();
    repo
      .list()
      .then((transactions) => {
        // setState is in a Promise callback — not synchronous in the effect body.
        if (active) setState({ status: 'ready', transactions });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', error: error as Error });
      });
    return () => {
      active = false;
    };
  }, [revision]);

  // Note: a future swap to a remote repo is a one-line change here.
  const create = useCallback(async (input: TransactionInput) => {
    const repo = createLocalStorageTransactionRepository();
    await repo.create(input);
    reload();
  }, [reload]);

  const update = useCallback(async (id: string, patch: Partial<TransactionInput>) => {
    const repo = createLocalStorageTransactionRepository();
    await repo.update(id, patch);
    reload();
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    const repo = createLocalStorageTransactionRepository();
    await repo.remove(id);
    reload();
  }, [reload]);

  // N individual removes — bulkRemove is a future repo concern, not now.
  const removeMany = useCallback(async (ids: string[]) => {
    const repo = createLocalStorageTransactionRepository();
    await Promise.all(ids.map((id) => repo.remove(id)));
    reload();
  }, [reload]);

  const addMany = useCallback(async (transactions: Transaction[]) => {
    const repo = createLocalStorageTransactionRepository();
    await repo.createMany(transactions);
    reload();
  }, [reload]);

  return { state, create, update, remove, removeMany, addMany };
}
