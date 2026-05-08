'use client';
import { useState } from 'react';
import { Button, TextInput, Tile } from '@carbon/react';
import type { Settings } from '@/src/lib/settings';

interface Props {
  settings: Settings;
  onSet: (value: Settings) => Promise<void>;
}

export function FinnhubKeyTile({ settings, onSet }: Props) {
  const [draft, setDraft] = useState(settings.finnhubKey ?? '');

  function handleBlur() {
    const trimmed = draft.trim();
    const next = trimmed.length > 0 ? trimmed : null;
    if (next !== settings.finnhubKey) {
      void onSet({ ...settings, finnhubKey: next });
    }
  }

  return (
    <Tile style={{ border: '1px solid var(--cds-border-subtle-01)' }}>
      <p className="cds--type-productive-heading-01" style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}>
        Finnhub API key
      </p>
      <TextInput
        id="finnhub-key"
        type="password"
        labelText="Finnhub key"
        helperText="Stored in your browser's LocalStorage. We never send it to our servers because we don't have any."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 'var(--cds-spacing-03)',
        }}
      >
        <Button kind="tertiary" size="sm" disabled>
          Test connection
        </Button>
        <p className="cds--label" style={{ color: 'var(--cds-text-helper)' }}>
          Available once Live Tickers ship in Phase 3.
        </p>
      </div>
    </Tile>
  );
}
