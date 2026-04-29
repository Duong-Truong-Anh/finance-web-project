'use client';

import { useRouter } from 'next/navigation';
import { HeaderGlobalAction } from '@carbon/react';
import { Settings } from '@carbon/icons-react';

export default function SettingsLink() {
  const router = useRouter();

  return (
    <HeaderGlobalAction
      aria-label="Settings"
      onClick={() => router.push('/settings')}
    >
      <Settings size={20} />
    </HeaderGlobalAction>
  );
}
