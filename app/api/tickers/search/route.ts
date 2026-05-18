import { NextResponse } from 'next/server';
import { searchTickers, type SearchResponse } from '@/src/lib/tickers';

const cache = new Map<string, { response: SearchResponse; expiresAt: number }>();
const TTL_MS = 60_000;

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

  const cacheKey = `${apiKey}:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.response);
  }

  const response = await searchTickers(query, apiKey);
  if (response.ok) {
    cache.set(cacheKey, { response, expiresAt: Date.now() + TTL_MS });
  }
  return NextResponse.json(response);
}
