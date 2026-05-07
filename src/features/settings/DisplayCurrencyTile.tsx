'use client';
import { FormGroup, RadioButton, RadioButtonGroup, Tile } from '@carbon/react';
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
    <Tile style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}>
      <FormGroup legendText="Display currency">
        <RadioButtonGroup
          name="display-currency"
          valueSelected={settings.displayCurrency}
          onChange={handleChange}
          orientation="vertical"
        >
          <RadioButton id="currency-vnd" value="VND" labelText="VND – Vietnamese Đồng" />
          <RadioButton id="currency-usd" value="USD" labelText="USD – US Dollar" />
        </RadioButtonGroup>
      </FormGroup>
    </Tile>
  );
}
