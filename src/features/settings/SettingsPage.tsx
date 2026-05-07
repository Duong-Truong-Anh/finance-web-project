'use client';
import { InlineLoading, InlineNotification } from '@carbon/react';
import { useSettings } from './useSettings';
import { DisplayCurrencyTile } from './DisplayCurrencyTile';
import { ThemeTile } from './ThemeTile';
import { FinnhubKeyTile } from './FinnhubKeyTile';
import { FxRatesTile } from './FxRatesTile';
import { DataTile } from './DataTile';

export function SettingsPage() {
  const { status, settings, error, set } = useSettings();

  if (status === 'loading') {
    return <InlineLoading description="Loading settings…" />;
  }

  if (status === 'error') {
    return (
      <InlineNotification
        kind="error"
        title="Could not load settings."
        subtitle={error?.message ?? 'Unknown error'}
        hideCloseButton
      />
    );
  }

  return (
    <form aria-labelledby="settings-heading">
      <h1
        id="settings-heading"
        className="cds--type-productive-heading-04"
        style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}
      >
        Settings
      </h1>
      <DisplayCurrencyTile settings={settings} onSet={set} />
      <ThemeTile settings={settings} onSet={set} />
      <FinnhubKeyTile settings={settings} onSet={set} />
      <FxRatesTile settings={settings} onSet={set} />
      <DataTile />
    </form>
  );
}
