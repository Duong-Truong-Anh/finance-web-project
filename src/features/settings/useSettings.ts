'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  settingsRepository,
  DEFAULT_SETTINGS,
  type Settings,
} from '@/src/lib/settings';

type SettingsState =
  | { status: 'loading'; settings: null; error: null }
  | { status: 'ready'; settings: Settings; error: null }
  | { status: 'error'; settings: null; error: Error };

export type UseSettingsResult = SettingsState & {
  set: (value: Settings) => Promise<void>;
};

export function useSettings(): UseSettingsResult {
  const [state, setState] = useState<SettingsState>({
    status: 'loading',
    settings: null,
    error: null,
  });

  useEffect(() => {
    let active = true;
    settingsRepository
      .get()
      .then((s) => {
        if (active)
          setState({
            status: 'ready',
            settings: s ?? DEFAULT_SETTINGS,
            error: null,
          });
      })
      .catch((error: unknown) => {
        if (active)
          setState({ status: 'error', settings: null, error: error as Error });
      });
    return () => {
      active = false;
    };
  }, []);

  const set = useCallback(async (value: Settings) => {
    await settingsRepository.set(value);
    setState({ status: 'ready', settings: value, error: null });
  }, []);

  return { ...state, set };
}
