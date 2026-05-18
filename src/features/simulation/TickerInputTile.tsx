'use client';
import { useState } from 'react';
import { TextInput, Tile } from '@carbon/react';

interface Props {
  index: number;            // 0..4
  symbol: string;           // current persisted symbol; '' for empty slot
  onCommit: (symbol: string) => void;
}

export default function TickerInputTile({ index, symbol, onCommit }: Props) {
  const [draft, setDraft] = useState(symbol);
  const [lastPropSymbol, setLastPropSymbol] = useState(symbol);

  // Render-phase sync: pick up external changes to the persisted symbol.
  if (symbol !== lastPropSymbol) {
    setLastPropSymbol(symbol);
    setDraft(symbol);
  }

  function handleBlur() {
    const next = draft.trim().toUpperCase();
    if (next === symbol) return;
    setDraft(next);
    onCommit(next);
  }

  const slotNumber = index + 1;

  return (
    <Tile style={{ padding: 'var(--cds-spacing-05)' }}>
      <TextInput
        id={`ticker-slot-${slotNumber}`}
        labelText={`Ticker ${slotNumber}`}
        placeholder="Add ticker"
        maxLength={20}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
      />
    </Tile>
  );
}
