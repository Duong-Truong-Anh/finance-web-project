'use client';
import { useEffect, useState } from 'react';
import { createFxRepository } from '@/src/lib/currency/fx-repository';
import type { FxRateSnapshot } from '@/src/lib/currency/types';

export type FxState =
  | { status: 'loading' }
  | { status: 'ready'; fx: FxRateSnapshot }
  | { status: 'error'; error: Error };

export function useFx(): FxState {
  const [state, setState] = useState<FxState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    const repo = createFxRepository();
    repo
      .getCurrent()
      .then((fx) => {
        // setState is in a Promise callback — not synchronous in the effect body.
        if (active) setState({ status: 'ready', fx });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', error: error as Error });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
