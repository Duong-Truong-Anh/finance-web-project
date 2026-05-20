'use client';
import { useCallback, useEffect, useState } from 'react';
import type { QuoteErrorCode, QuoteResponse, TickerQuote } from '@/src/lib/tickers';

export type QuoteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; quote: TickerQuote | null }
  | { status: 'error'; error: QuoteErrorCode };

type ResolvedOutcome =
  | { status: 'ready'; quote: TickerQuote | null }
  | { status: 'error'; error: QuoteErrorCode };

export function useTickerQuote(
  symbol: string | null,
  apiKey: string | null,
): { state: QuoteState; refresh: () => void } {
  const [result, setResult] = useState<{ key: string; outcome: ResolvedOutcome } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const requestKey = symbol && apiKey ? `${symbol}:${apiKey}:${refreshTick}` : null;

  useEffect(() => {
    if (!requestKey || !symbol || !apiKey) return;
    let active = true;
    fetch('/api/tickers/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, apiKey }),
    })
      .then((r) => r.json() as Promise<QuoteResponse>)
      .then((res) => {
        if (!active) return;
        const outcome: ResolvedOutcome = res.ok
          ? { status: 'ready', quote: res.quote }
          : { status: 'error', error: res.error };
        setResult({ key: requestKey, outcome });
      })
      .catch(() => {
        if (!active) return;
        setResult({ key: requestKey, outcome: { status: 'error', error: 'network' } });
      });
    return () => {
      active = false;
    };
  }, [requestKey, symbol, apiKey]);

  const state: QuoteState =
    requestKey === null
      ? { status: 'idle' }
      : result?.key === requestKey
        ? result.outcome
        : { status: 'loading' };

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  return { state, refresh };
}
