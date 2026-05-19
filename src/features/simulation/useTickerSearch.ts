'use client';
import { useCallback } from 'react';
import type { SearchResponse, TickerSearchResult } from '@/src/lib/tickers';

export function useTickerSearch(
  apiKey: string | null,
): (query: string) => Promise<TickerSearchResult[]> {
  return useCallback(
    async (query: string) => {
      if (!apiKey) return [];
      if (!query.trim()) return [];
      const res = await fetch('/api/tickers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, apiKey }),
      });
      const data = (await res.json()) as SearchResponse;
      if (!data.ok) throw new Error(data.error);
      return data.results;
    },
    [apiKey],
  );
}
