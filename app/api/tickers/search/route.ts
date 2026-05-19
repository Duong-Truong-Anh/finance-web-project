import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { searchTickers, type SearchResponse } from '@/src/lib/tickers';

const TTL_MS = 60_000;
const MAX_CACHE_SIZE = 100;
const cache = new Map<string, { response: SearchResponse; expiresAt: number }>();

function cacheKeyFor(apiKey: string, query: string): string {
  const hash = createHash('sha256').update(apiKey).digest('hex').slice(0, 16);
  return `${hash}:${query.toLowerCase()}`;
}

function readCache(key: string): SearchResponse | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.response;
}

function writeCache(key: string, response: SearchResponse): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    // FIFO eviction: Map iteration order is insertion order, so the
    // first key is the oldest. Good enough for a 100-entry / 60s window;
    // LRU's read-time bookkeeping would not buy anything at this scale.
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { response, expiresAt: Date.now() + TTL_MS });
}

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

  const key = cacheKeyFor(apiKey, query);
  const cached = readCache(key);
  if (cached) return NextResponse.json(cached);

  const response = await searchTickers(query, apiKey);
  if (response.ok) writeCache(key, response);
  return NextResponse.json(response);
}
