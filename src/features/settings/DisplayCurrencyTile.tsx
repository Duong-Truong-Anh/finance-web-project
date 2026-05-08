'use client';
import { RadioButton, RadioButtonGroup, Tile } from '@carbon/react';
import type { Settings } from '@/src/lib/settings';

interface Props {
  settings: Settings;
  onSet: (value: Settings) => Promise<void>;
}

export function DisplayCurrencyTile({ settings, onSet }: Props) {
  function handleChange(value: string | number | undefined) {
    if (value !== 'VND' && value !== 'USD') return;
    void onSet({ ...settings, displayCurrency: value });
  }

  return (
    <Tile style={{ border: '1px solid var(--cds-border-subtle-01)' }}>
      {/* Visible heading; RadioButtonGroup's legendText provides the sr-only accessible label */}
      <p
        aria-hidden="true"
        className="cds--type-productive-heading-01"
        style={{ marginBlockEnd: 'var(--cds-spacing-04)' }}
      >
        Display currency
      </p>
      <RadioButtonGroup
        legendText="Display currency"
        name="display-currency"
        valueSelected={settings.displayCurrency}
        onChange={handleChange}
        orientation="vertical"
      >
        <RadioButton id="currency-vnd" value="VND" labelText="VND – Vietnamese Đồng" />
        <RadioButton id="currency-usd" value="USD" labelText="USD – US Dollar" />
      </RadioButtonGroup>
    </Tile>
  );
}
