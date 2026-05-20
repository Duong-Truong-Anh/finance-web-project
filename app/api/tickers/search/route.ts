import { NextResponse } from 'next/server';
import { searchTickers, type SearchResponse } from '@/src/lib/tickers';
import { createRouteCache } from '@/src/lib/tickers/route-cache';

const TTL_MS = 60_000;
const cache = createRouteCache<SearchResponse>();

export async function POST(request: Request): Promise<NextResponse> {
  let payload: { query?: unknown; apiKey?: unknown };
  try {
    payload = (await request.json()) as { query?: unknown; apiKey?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: 'unknown' }, { status: 400 });
  }

  const { query, apiKey } = payload;
  if (typeof query !== 'string' || typeof apiKey !== 'string') {
    return NextResponse.json({ ok: false, error: 'unknown' }, { status: 400 });
  }

  const key = cache.keyFor(apiKey, query);
  const cached = cache.read(key);
  if (cached) return NextResponse.json(cached);

  const response = await searchTickers(query, apiKey);
  if (response.ok) cache.write(key, response, TTL_MS);
  return NextResponse.json(response);
}
