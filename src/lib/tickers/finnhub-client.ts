import type {
  FinnhubResult,
  QuoteResponse,
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

export async function fetchQuote(
  symbol: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<QuoteResponse> {
  if (!apiKey) return { ok: false, error: 'no-key' };
  if (!symbol.trim()) return { ok: true, quote: null };

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apiKey)}`;
    const res = await fetchImpl(url);

    if (res.status === 401 || res.status === 403) return { ok: false, error: 'invalid-key' };
    if (res.status === 429) return { ok: false, error: 'rate-limited' };
    if (!res.ok) return { ok: false, error: 'network' };

    const data = (await res.json()) as { c: number; dp: number | null; pc: number };
    if (data.c === 0 && data.pc === 0) return { ok: true, quote: null };

    return {
      ok: true,
      quote: {
        currentPrice: data.c,
        percentChange: data.dp ?? 0,
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch {
    return { ok: false, error: 'network' };
  }
}
