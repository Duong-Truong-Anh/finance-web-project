import { NextResponse } from 'next/server';
import type { FxRateSnapshot } from '@/src/lib/currency/types';

// Module-level cache; persists for the lifetime of the server process.
// Not cached on 502 — only successful snapshots are retained.
let serverCache: { snapshot: FxRateSnapshot; expiresAt: number } | null = null;

const CACHE_TTL_MS = 60_000; // 60 seconds

interface ErApiResponse {
  result: string;
  rates: Record<string, number>;
}

export async function GET(): Promise<NextResponse> {
  const now = Date.now();

  if (serverCache && now < serverCache.expiresAt) {
    return NextResponse.json(serverCache.snapshot);
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error(`Upstream returned ${res.status}`);

    const data = (await res.json()) as ErApiResponse;
    if (data.result !== 'success' || typeof data.rates?.VND !== 'number') {
      throw new Error('Unexpected upstream response shape');
    }

    const snapshot: FxRateSnapshot = {
      base: 'USD',
      rates: { VND: data.rates.VND, USD: 1 },
      fetchedAt: new Date().toISOString(),
    };

    serverCache = { snapshot, expiresAt: now + CACHE_TTL_MS };
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}
