'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  portfolioRepository,
  DEFAULT_PORTFOLIO_CONFIG,
  type PortfolioConfig,
} from '@/src/lib/portfolio';

type State =
  | { status: 'loading' }
  | { status: 'ready'; config: PortfolioConfig }
  | { status: 'error'; error: Error };

export type UsePortfolioConfigResult = State & {
  set: (next: PortfolioConfig) => Promise<void>;
};

export function usePortfolioConfig(): UsePortfolioConfigResult {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    portfolioRepository
      .get()
      .then((config) => {
        if (active) setState({ status: 'ready', config: config ?? DEFAULT_PORTFOLIO_CONFIG });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', error: error as Error });
      });
    return () => {
      active = false;
    };
  }, []);

  const set = useCallback(async (next: PortfolioConfig) => {
    await portfolioRepository.set(next);
    setState({ status: 'ready', config: next });
  }, []);

  // Memoized so consumers' useMemo deps see stable identity until state changes.
  return useMemo<UsePortfolioConfigResult>(() => ({ ...state, set }), [state, set]);
}
