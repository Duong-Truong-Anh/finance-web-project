import { NextResponse } from 'next/server';
import { fetchQuote, type QuoteResponse } from '@/src/lib/tickers';
import { createRouteCache } from '@/src/lib/tickers/route-cache';

const TTL_MS = 30_000;
const cache = createRouteCache<QuoteResponse>();

export async function POST(request: Request): Promise<NextResponse> {
  let payload: { symbol?: unknown; apiKey?: unknown };
  try {
    payload = (await request.json()) as { symbol?: unknown; apiKey?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: 'unknown' }, { status: 400 });
  }

  const { symbol, apiKey } = payload;
  if (typeof symbol !== 'string' || typeof apiKey !== 'string') {
    return NextResponse.json({ ok: false, error: 'unknown' }, { status: 400 });
  }

  const key = cache.keyFor(apiKey, symbol);
  const cached = cache.read(key);
  if (cached) return NextResponse.json(cached);

  const response = await fetchQuote(symbol, apiKey);
  if (response.ok) cache.write(key, response, TTL_MS);
  return NextResponse.json(response);
}
