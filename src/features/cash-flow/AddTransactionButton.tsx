'use client';
import { useState } from 'react';
import { Button } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import AddTransactionModal from './AddTransactionModal';
import type { TransactionInput } from '@/src/lib/transactions/schema';
import type { Currency } from '@/src/lib/currency/types';

interface Props {
  create: (input: TransactionInput) => Promise<void>;
  initialCurrency: Currency;
}

export default function AddTransactionButton({ create, initialCurrency }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button kind="primary" renderIcon={Add} onClick={() => setOpen(true)}>
        Add transaction
      </Button>
      <AddTransactionModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={create}
        initialCurrency={initialCurrency}
      />
    </>
  );
}
