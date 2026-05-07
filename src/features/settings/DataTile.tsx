'use client';
import { useState } from 'react';
import {
  Button,
  FormGroup,
  Modal,
  TextInput,
  Tile,
} from '@carbon/react';
import { STORAGE_NAMESPACE } from '@/src/lib/storage/keys';

// The Reset action clears ALL flowstate LocalStorage keys, not just settings.
// It does NOT go through settingsRepository.clear() because that only removes
// the settings record; a full data reset must remove transactions, portfolio, fx, etc.
function resetAllData(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < globalThis.localStorage.length; i++) {
    const key = globalThis.localStorage.key(i);
    if (key?.startsWith(STORAGE_NAMESPACE)) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => globalThis.localStorage.removeItem(k));

  // Clear cookies (set Max-Age=0 to expire immediately)
  document.cookie = 'flowstate-theme=; Path=/; Max-Age=0; SameSite=Lax';
  document.cookie = 'flowstate-currency=; Path=/; Max-Age=0; SameSite=Lax';

  // /onboarding does not exist yet (Phase 3+); fall back to /
  window.location.href = '/';
}

export function DataTile() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const canConfirm = confirmText === 'RESET';

  function openModal() {
    setConfirmText('');
    setModalOpen(true);
  }

  function handleConfirm() {
    setModalOpen(false);
    resetAllData();
  }

  return (
    <>
      <Tile style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}>
        <FormGroup legendText="Data">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--cds-spacing-04)',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <Button kind="tertiary" size="sm" disabled>
                Export all data (CSV bundle)
              </Button>
              <p
                className="cds--label"
                style={{
                  marginBlockStart: 'var(--cds-spacing-02)',
                  color: 'var(--cds-text-helper)',
                }}
              >
                Use the Export CSV button on Cash Flow. Cross-feature bundle ships in Reports
                (Phase 4).
              </p>
            </div>
            <div>
              <Button kind="tertiary" size="sm" disabled>
                Import a CSV bundle
              </Button>
              <p
                className="cds--label"
                style={{
                  marginBlockStart: 'var(--cds-spacing-02)',
                  color: 'var(--cds-text-helper)',
                }}
              >
                Cross-feature import ships in Reports (Phase 4).
              </p>
            </div>
            <Button kind="danger" size="sm" onClick={openModal}>
              Reset all data
            </Button>
          </div>
        </FormGroup>
      </Tile>

      <Modal
        open={modalOpen}
        danger
        modalHeading="Reset all data?"
        primaryButtonText="Reset"
        secondaryButtonText="Cancel"
        primaryButtonDisabled={!canConfirm}
        onRequestClose={() => setModalOpen(false)}
        onRequestSubmit={handleConfirm}
        onSecondarySubmit={() => setModalOpen(false)}
      >
        <p style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}>
          This will permanently delete all transactions, portfolio configuration, and settings.
          There is no undo. Export your data first if you want to keep a backup.
        </p>
        <TextInput
          id="reset-confirm"
          labelText='Type "RESET" to confirm'
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="RESET"
          data-testid="reset-confirm-input"
        />
      </Modal>
    </>
  );
}
