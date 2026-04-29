'use client';

import { useRouter } from 'next/navigation';
import { HeaderGlobalAction } from '@carbon/react';
import { Asleep, Light } from '@carbon/icons-react';
import { writeCookie } from '@/app/lib/cookies-client';
import type { Theme } from '@/src/lib/settings/repository';

const NEXT_THEME: Record<Theme, Theme> = {
  g90: 'g100',
  g100: 'white',
  white: 'g90',
};

const LABEL: Record<Theme, string> = {
  g90: 'Switch to darker theme (g100)',
  g100: 'Switch to light theme',
  white: 'Switch to dark theme (g90)',
};

export default function ThemeSwitcher({ current }: { current: Theme }) {
  const router = useRouter();

  function handleClick() {
    const next = NEXT_THEME[current];
    writeCookie('flowstate-theme', next);
    router.refresh();
  }

  return (
    <HeaderGlobalAction aria-label={LABEL[current]} onClick={handleClick}>
      {current === 'white' ? <Asleep size={20} /> : <Light size={20} />}
    </HeaderGlobalAction>
  );
}
