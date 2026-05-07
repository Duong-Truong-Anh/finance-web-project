'use client';
import { useEffect, useState } from 'react';
import {
  Button,
  FormGroup,
  InlineLoading,
  InlineNotification,
  StructuredListWrapper,
  StructuredListBody,
  StructuredListCell,
  StructuredListRow,
  Tile,
  Toggle,
} from '@carbon/react';
import { createFxRepository } from '@/src/lib/currency/fx-repository';
import type { FxRateSnapshot } from '@/src/lib/currency/types';
import type { Settings } from '@/src/lib/settings';

interface Props {
  settings: Settings;
  onSet: (value: Settings) => Promise<void>;
}

type FxState =
  | { status: 'loading' }
  | { status: 'ready'; snapshot: FxRateSnapshot }
  | { status: 'error' };

export function FxRatesTile({ settings, onSet }: Props) {
  const [fxState, setFxState] = useState<FxState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    const repo = createFxRepository();
    repo
      .getCurrent()
      .then((snapshot) => {
        if (active) setFxState({ status: 'ready', snapshot });
      })
      .catch(() => {
        if (active) setFxState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const repo = createFxRepository();
      const snapshot = await repo.refresh();
      setFxState({ status: 'ready', snapshot });
    } catch {
      setFxState({ status: 'error' });
    } finally {
      setRefreshing(false);
    }
  }

  function handleToggle(checked: boolean) {
    void onSet({ ...settings, fxAutoRefresh: checked });
  }

  const fetchedAt =
    fxState.status === 'ready'
      ? new Date(fxState.snapshot.fetchedAt).toLocaleString()
      : null;

  return (
    <Tile style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}>
      <FormGroup legendText="FX rates">
        {fxState.status === 'loading' && <InlineLoading description="Loading FX rates…" />}
        {fxState.status === 'error' && (
          <InlineNotification
            kind="warning"
            title="FX rates unavailable."
            subtitle="Click Refresh now to try again."
            hideCloseButton
            style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}
          />
        )}
        {fxState.status === 'ready' && (
          <StructuredListWrapper isCondensed style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}>
            <StructuredListBody>
              <StructuredListRow>
                <StructuredListCell>USD → VND</StructuredListCell>
                <StructuredListCell>
                  {fxState.snapshot.rates.VND.toLocaleString('vi-VN')} ₫
                </StructuredListCell>
              </StructuredListRow>
              <StructuredListRow>
                <StructuredListCell>Fetched at</StructuredListCell>
                <StructuredListCell>{fetchedAt}</StructuredListCell>
              </StructuredListRow>
            </StructuredListBody>
          </StructuredListWrapper>
        )}
        <Button
          kind="tertiary"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}
        >
          {refreshing ? 'Refreshing…' : 'Refresh now'}
        </Button>
        <Toggle
          id="fx-auto-refresh"
          labelText="Refresh automatically once a day"
          toggled={settings.fxAutoRefresh}
          onToggle={handleToggle}
        />
        {/* Auto-refresh scheduler not yet implemented — the toggle persists the preference
            only. A future hook or server action will read fxAutoRefresh and schedule refresh. */}
      </FormGroup>
    </Tile>
  );
}
