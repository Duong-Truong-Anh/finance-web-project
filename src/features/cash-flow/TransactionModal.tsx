'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  ComposedModal,
  DatePicker,
  DatePickerInput,
  InlineNotification,
  ModalBody,
  ModalFooter,
  ModalHeader,
  NumberInput,
  RadioButton,
  RadioButtonGroup,
  Select,
  SelectItem,
  Stack,
  TextArea,
  TextInput,
} from '@carbon/react';
import { transactionInputSchema } from '@/src/lib/transactions/schema';
import type { Transaction, TransactionInput } from '@/src/lib/transactions/schema';
import { StorageQuotaExceededError } from '@/src/lib/storage/errors';
import type { Currency } from '@/src/lib/currency/types';

export type ModalState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; transaction: Transaction };

interface Props {
  modalState: ModalState;
  onClose: () => void;
  onCreate: (input: TransactionInput) => Promise<void>;
  onUpdate: (id: string, patch: Partial<TransactionInput>) => Promise<void>;
  initialCurrency: Currency;
}

type FieldErrors = Partial<Record<keyof TransactionInput, string>>;

function todayIso(): string {
  return Intl.DateTimeFormat('en-CA').format(new Date());
}

// TransactionModal is remounted by the parent via a key prop whenever the
// mode or target transaction changes. useState initializers therefore always
// reflect the correct starting values without a synchronous setState-in-effect.
export default function TransactionModal({
  modalState,
  onClose,
  onCreate,
  onUpdate,
  initialCurrency,
}: Props) {
  const isEdit = modalState.open && modalState.mode === 'edit';
  const tx = isEdit
    ? (modalState as { open: true; mode: 'edit'; transaction: Transaction }).transaction
    : null;

  const [kind, setKind] = useState<'income' | 'expense'>(tx?.kind ?? 'expense');
  const [name, setName] = useState(tx?.name ?? '');
  const [amount, setAmount] = useState<number>(tx?.amount.amount ?? 0);
  const [currency, setCurrency] = useState<Currency>(tx?.amount.currency ?? initialCurrency);
  const [date, setDate] = useState(tx?.occurredOn ?? todayIso());
  const [notes, setNotes] = useState(tx?.notes ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = useCallback(() => {
    setErrors({});
    setStorageError(null);
    setIsSaving(false);
    onClose();
  }, [onClose]);

  const handleSave = useCallback(async () => {
    const input = {
      kind,
      name,
      amount: { amount, currency },
      occurredOn: date,
      notes: notes.trim() || null,
    };

    const result = transactionInputSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof TransactionInput;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      if (isEdit && tx) {
        await onUpdate(tx.id, result.data);
      } else {
        await onCreate(result.data);
      }
      handleClose();
    } catch (err) {
      if (err instanceof StorageQuotaExceededError) {
        setStorageError('Browser storage is full. Export your data and reset.');
      } else {
        throw err;
      }
    } finally {
      setIsSaving(false);
    }
  }, [kind, name, amount, currency, date, notes, isEdit, tx, onCreate, onUpdate, handleClose]);

  // Cmd/Ctrl + Enter saves from anywhere inside the modal.
  useEffect(() => {
    if (!modalState.open) return;
    const listener = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [modalState.open, handleSave]);

  return (
    <ComposedModal open={modalState.open} onClose={handleClose} size="sm">
      <ModalHeader title={isEdit ? 'Edit transaction' : 'Add transaction'} />
      <ModalBody hasForm>
        {storageError && (
          <InlineNotification
            kind="error"
            title="Storage full"
            subtitle={storageError}
            lowContrast
            style={{ marginBottom: 'var(--cds-spacing-05)' }}
          />
        )}
        <Stack gap={5}>
          <RadioButtonGroup
            legendText="Kind"
            name="kind"
            valueSelected={kind}
            onChange={(value) => setKind(value as 'income' | 'expense')}
          >
            <RadioButton labelText="Income" value="income" id="modal-kind-income" />
            <RadioButton labelText="Expense" value="expense" id="modal-kind-expense" />
          </RadioButtonGroup>

          <TextInput
            id="modal-name"
            labelText="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxCount={80}
            enableCounter
            invalid={!!errors.name}
            invalidText={errors.name ?? ''}
          />

          <NumberInput
            id="modal-amount"
            label="Amount"
            min={0}
            step={1}
            value={amount}
            onChange={(_e, { value }) => {
              const parsed =
                typeof value === 'number' ? value : parseInt(String(value), 10);
              setAmount(isNaN(parsed) ? 0 : Math.max(0, parsed));
            }}
            helperText="Enter in minor units — VND: đồng (e.g. 50000), USD: cents (e.g. 500 = $5.00)"
            invalid={!!errors.amount}
            invalidText={errors.amount ?? ''}
          />

          <Select
            id="modal-currency"
            labelText="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
          >
            <SelectItem value="VND" text="VND — Vietnamese Đồng" />
            <SelectItem value="USD" text="USD — US Dollar" />
          </Select>

          <DatePicker
            datePickerType="single"
            dateFormat="Y-m-d"
            value={date}
            onChange={(_dates, dateStr) => {
              if (dateStr) setDate(dateStr);
            }}
          >
            <DatePickerInput
              id="modal-occurred-on"
              labelText="Date"
              placeholder="YYYY-MM-DD"
              invalid={!!errors.occurredOn}
              invalidText={errors.occurredOn ?? ''}
            />
          </DatePicker>

          <TextArea
            id="modal-notes"
            labelText="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxCount={400}
            enableCounter
            rows={3}
            invalid={!!errors.notes}
            invalidText={errors.notes ?? ''}
          />
        </Stack>
      </ModalBody>
      <ModalFooter
        primaryButtonText="Save"
        secondaryButtonText="Cancel"
        onRequestSubmit={handleSave}
        primaryButtonDisabled={isSaving}
      >
        {null}
      </ModalFooter>
    </ComposedModal>
  );
}
