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

      <section aria-labelledby="settings-group-display" style={{ marginBlockEnd: 'var(--cds-spacing-09)' }}>
        <h2
          id="settings-group-display"
          className="cds--type-productive-heading-03"
          style={{ marginBlockEnd: 'var(--cds-spacing-05)', color: 'var(--cds-text-secondary)' }}
        >
          Display preferences
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cds-spacing-07)' }}>
          <DisplayCurrencyTile settings={settings} onSet={set} />
          <ThemeTile settings={settings} onSet={set} />
        </div>
      </section>

      <section aria-labelledby="settings-group-integrations" style={{ marginBlockEnd: 'var(--cds-spacing-09)' }}>
        <h2
          id="settings-group-integrations"
          className="cds--type-productive-heading-03"
          style={{ marginBlockEnd: 'var(--cds-spacing-05)', color: 'var(--cds-text-secondary)' }}
        >
          Integrations
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cds-spacing-07)' }}>
          <FinnhubKeyTile settings={settings} onSet={set} />
          <FxRatesTile settings={settings} onSet={set} />
        </div>
      </section>

      <section aria-labelledby="settings-group-data">
        <h2
          id="settings-group-data"
          className="cds--type-productive-heading-03"
          style={{ marginBlockEnd: 'var(--cds-spacing-05)', color: 'var(--cds-text-secondary)' }}
        >
          Data
        </h2>
        <DataTile />
      </section>
    </form>
  );
}
