import type {
  FinnhubResult,
  SearchResponse,
  TickerSearchResult,
} from './types';

export async function searchTickers(
  query: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SearchResponse> {
  if (!apiKey) return { ok: false, error: 'no-key' };
  if (!query.trim()) return { ok: true, results: [] };

  try {
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${encodeURIComponent(apiKey)}`;
    const res = await fetchImpl(url);

    if (res.status === 401 || res.status === 403) return { ok: false, error: 'invalid-key' };
    if (res.status === 429) return { ok: false, error: 'rate-limited' };
    if (!res.ok) return { ok: false, error: 'network' };

    const data = (await res.json()) as { count: number; result: FinnhubResult[] };
    return { ok: true, results: data.result.map(toTickerSearchResult) };
  } catch {
    return { ok: false, error: 'network' };
  }
}

function toTickerSearchResult(r: FinnhubResult): TickerSearchResult {
  const lastDot = r.symbol.lastIndexOf('.');
  const exchange = lastDot > 0 ? r.symbol.slice(lastDot + 1) : null;
  return {
    symbol: r.symbol,
    description: r.description,
    exchange,
    type: r.type,
  };
}
