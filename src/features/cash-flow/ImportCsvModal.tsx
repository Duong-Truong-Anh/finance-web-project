'use client';
import { useState } from 'react';
import {
  Modal,
  FileUploaderDropContainer,
  InlineNotification,
  InlineLoading,
} from '@carbon/react';
import type { Transaction } from '@/src/lib/transactions/schema';
import type { ParseError } from '@/src/lib/csv/types';
import { parseCsv } from '@/src/lib/csv/parse';

type ModalState =
  | { kind: 'idle' }
  | { kind: 'previewing'; valid: Transaction[]; errors: ParseError[] }
  | { kind: 'importing'; valid: Transaction[]; errors: ParseError[] };

interface Props {
  open: boolean;
  onClose: () => void;
  addMany: (transactions: Transaction[]) => Promise<void>;
}

export default function ImportCsvModal({ open, onClose, addMany }: Props) {
  const [state, setState] = useState<ModalState>({ kind: 'idle' });
  const [importError, setImportError] = useState<string | null>(null);

  function handleClose() {
    setState({ kind: 'idle' });
    setImportError(null);
    onClose();
  }

  async function handleImport() {
    if (state.kind !== 'previewing' || state.valid.length === 0) return;
    const { valid, errors } = state;
    setState({ kind: 'importing', valid, errors });
    try {
      await addMany(valid);
      setState({ kind: 'idle' });
      setImportError(null);
      onClose();
    } catch (err) {
      setState({ kind: 'previewing', valid, errors });
      setImportError(err instanceof Error ? err.message : 'Import failed. Try again.');
    }
  }

  const isImporting = state.kind === 'importing';
  const isPreviewing = state.kind === 'previewing' || isImporting;
  const canImport = state.kind === 'previewing' && state.valid.length > 0;

  const primaryText = isImporting ? (
    <InlineLoading description="Importing..." />
  ) : isPreviewing && state.valid.length > 0 ? (
    `Import ${state.valid.length} row${state.valid.length === 1 ? '' : 's'}`
  ) : (
    'Import'
  );

  return (
    <Modal
      open={open}
      modalHeading="Import CSV"
      primaryButtonText={primaryText}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!canImport || isImporting}
      onRequestClose={handleClose}
      onRequestSubmit={handleImport}
      onSecondarySubmit={handleClose}
    >
      {importError && (
        <InlineNotification
          kind="error"
          lowContrast
          hideCloseButton
          title="Import failed"
          subtitle={importError}
          style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}
        />
      )}

      {!isPreviewing && (
        <FileUploaderDropContainer
          accept={['.csv', 'text/csv']}
          labelText="Drag and drop a CSV file here or click to select"
          multiple={false}
          onAddFiles={async (_, { addedFiles }) => {
            const file = addedFiles[0];
            if (!file) return;
            const text = await file.text();
            const { valid, errors } = parseCsv(text);
            setState({ kind: 'previewing', valid, errors });
            setImportError(null);
          }}
        />
      )}

      {isPreviewing && (
        <>
          <p
            style={{
              marginBlockEnd:
                (state.errors.length > 0) ? 'var(--cds-spacing-05)' : undefined,
            }}
          >
            <strong>{state.valid.length}</strong> valid row
            {state.valid.length === 1 ? '' : 's'}
            {state.errors.length > 0 && (
              <>
                ,{' '}
                <strong>{state.errors.length}</strong> error
                {state.errors.length === 1 ? '' : 's'}
              </>
            )}
          </p>

          {state.errors.length > 0 && (
            <InlineNotification
              kind="warning"
              lowContrast
              hideCloseButton
              title={`${state.errors.length} row${state.errors.length === 1 ? '' : 's'} could not be imported`}
              subtitle={state.errors
                .slice(0, 5)
                .map((e) => `Row ${e.rowNumber}: ${e.message}`)
                .join(' · ')}
            />
          )}
        </>
      )}
    </Modal>
  );
}
