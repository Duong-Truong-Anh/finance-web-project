'use client';
import { useEffect, useState } from 'react';
import {
  portfolioRepository,
  DEFAULT_PORTFOLIO_CONFIG,
  type PortfolioConfig,
} from '@/src/lib/portfolio';

type State =
  | { status: 'loading' }
  | { status: 'ready'; config: PortfolioConfig }
  | { status: 'error'; error: Error };

export function usePortfolioConfig(): State {
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

  return state;
}
