'use client';
import { FormGroup, RadioButton, RadioButtonGroup, Tile } from '@carbon/react';
import type { Settings, Theme } from '@/src/lib/settings';

interface Props {
  settings: Settings;
  onSet: (value: Settings) => Promise<void>;
}

const THEME_LABELS: Record<Theme, string> = {
  g90: 'g90 – Dark (default)',
  g100: 'g100 – Darker',
  white: 'White – Light',
};

export function ThemeTile({ settings, onSet }: Props) {
  function handleChange(value: string | number | undefined) {
    if (value !== 'g90' && value !== 'g100' && value !== 'white') return;
    void onSet({ ...settings, theme: value });
  }

  return (
    <Tile style={{ marginBlockEnd: 'var(--cds-spacing-07)' }}>
      <FormGroup legendText="Theme">
        <RadioButtonGroup
          name="app-theme"
          valueSelected={settings.theme}
          onChange={handleChange}
          orientation="vertical"
        >
          {(['g90', 'g100', 'white'] as const).map((t) => (
            <RadioButton key={t} id={`theme-${t}`} value={t} labelText={THEME_LABELS[t]} />
          ))}
        </RadioButtonGroup>
      </FormGroup>
    </Tile>
  );
}
