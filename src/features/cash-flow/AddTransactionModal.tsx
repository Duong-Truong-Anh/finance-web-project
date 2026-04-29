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
import type { TransactionInput } from '@/src/lib/transactions/schema';
import { StorageQuotaExceededError } from '@/src/lib/storage/errors';
import type { Currency } from '@/src/lib/currency/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (input: TransactionInput) => Promise<void>;
  initialCurrency: Currency;
}

type FieldErrors = Partial<Record<keyof TransactionInput, string>>;

function todayIso(): string {
  return Intl.DateTimeFormat('en-CA').format(new Date());
}

export default function AddTransactionModal({
  open,
  onClose,
  onCreated,
  initialCurrency,
}: Props) {
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [date, setDate] = useState(todayIso);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // All close paths (X button, Escape, Cancel) flow through ComposedModal.onClose.
  // Resetting form here covers every scenario without needing a useEffect.
  const handleClose = useCallback(() => {
    setKind('expense');
    setName('');
    setAmount(0);
    setCurrency(initialCurrency);
    setDate(todayIso());
    setNotes('');
    setErrors({});
    setStorageError(null);
    setIsSaving(false);
    onClose();
  }, [initialCurrency, onClose]);

  const handleSave = useCallback(async () => {
    const input = {
      kind,
      name,
      amount,
      currency,
      occurredOn: date,
      notes: notes.trim() || null,
    };

    // Validate-on-submit: run Zod parse and surface field-level errors.
    // Chosen over validate-on-blur for simplicity while giving Carbon's
    // invalid+invalidText exactly the data they need.
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
      await onCreated(result.data);
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
  }, [kind, name, amount, currency, date, notes, onCreated, handleClose]);

  // Cmd/Ctrl + Enter saves from anywhere inside the modal.
  // handleSave is in deps so the listener always calls the latest version.
  useEffect(() => {
    if (!open) return;
    const listener = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [open, handleSave]);

  return (
    <ComposedModal open={open} onClose={handleClose} size="sm">
      <ModalHeader title="Add transaction" />
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
