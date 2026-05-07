'use client';
import { useState } from 'react';
import { Button, FormGroup, TextInput, Tile } from '@carbon/react';
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
    <Tile style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}>
      <FormGroup legendText="Finnhub API key">
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
        <Button
          kind="tertiary"
          size="sm"
          disabled
          title="Available once Live Tickers ship in Phase 3."
        >
          Test connection
        </Button>
        <p
          className="cds--label"
          style={{ marginBlockStart: 'var(--cds-spacing-03)', color: 'var(--cds-text-helper)' }}
        >
          Available once Live Tickers ship in Phase 3.
        </p>
      </FormGroup>
    </Tile>
  );
}
