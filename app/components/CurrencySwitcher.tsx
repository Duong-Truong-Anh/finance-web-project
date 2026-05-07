'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HeaderGlobalAction,
  Popover,
  PopoverContent,
  RadioButtonGroup,
  RadioButton,
} from '@carbon/react';
import { Currency } from '@carbon/icons-react';
import { useSettings } from '@/src/features/settings/useSettings';
import { DEFAULT_SETTINGS } from '@/src/lib/settings';
import type { Currency as CurrencyType } from '@/src/lib/currency/types';

export default function CurrencySwitcher({ current }: { current: CurrencyType }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { settings, set: setSettings } = useSettings();

  async function handleChange(value: string | number | undefined) {
    if (value !== 'VND' && value !== 'USD') return;
    // set() writes to LocalStorage AND mirrors displayCurrency to the flowstate-currency
    // cookie. The cookie write is synchronous inside set(), so router.refresh() sees the
    // updated cookie on the next server request.
    await setSettings({ ...(settings ?? DEFAULT_SETTINGS), displayCurrency: value });
    setOpen(false);
    router.refresh();
  }

  return (
    <Popover
      open={open}
      align="bottom-right"
      caret={false}
      onRequestClose={() => setOpen(false)}
    >
      <HeaderGlobalAction
        // enterDelayMs flows through Button → IconButton → Tooltip at runtime but
        // is absent from HeaderGlobalActionProps in @carbon/react 1.106.x.
        {...({ enterDelayMs: open ? 1_000_000 : 100 } as any)}
        aria-label={`Display currency: ${current}`}
        onClick={() => setOpen((o) => !o)}
        isActive={open}
      >
        <span className="cds--label-01" style={{ padding: '0 var(--cds-spacing-02)' }}>
          {current}
        </span>
      </HeaderGlobalAction>
      <PopoverContent style={{ padding: 'var(--cds-spacing-05)' }}>
        <RadioButtonGroup
          legendText="Display currency"
          name="flowstate-currency"
          valueSelected={current}
          onChange={handleChange}
          orientation="vertical"
        >
          <RadioButton labelText="VND – Vietnamese Đồng" value="VND" id="currency-vnd" />
          <RadioButton labelText="USD – US Dollar" value="USD" id="currency-usd" />
        </RadioButtonGroup>
      </PopoverContent>
    </Popover>
  );
}
