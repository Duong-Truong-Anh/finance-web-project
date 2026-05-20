import { describe, expect, it, vi } from 'vitest';
import { fetchQuote, searchTickers } from './finnhub-client';

function ok(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fail(status: number): Response {
  return new Response('', { status });
}

describe('searchTickers', () => {
  it('returns no-key error when apiKey is empty', async () => {
    const fetchImpl = vi.fn();
    const res = await searchTickers('AAPL', '', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'no-key' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns empty results for an empty query without calling fetch', async () => {
    const fetchImpl = vi.fn();
    const res = await searchTickers('   ', 'key123', fetchImpl);
    expect(res).toEqual({ ok: true, results: [] });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps a successful response into TickerSearchResult shape', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      ok({
        count: 3,
        result: [
          { symbol: 'AAPL', description: 'Apple Inc.', displaySymbol: 'AAPL', type: 'Common Stock' },
          { symbol: 'APPF', description: 'AppFolio Inc.', displaySymbol: 'APPF', type: 'Common Stock' },
          { symbol: 'VNM.HM', description: 'Vinamilk', displaySymbol: 'VNM.HM', type: 'Common Stock' },
        ],
      }),
    );
    const res = await searchTickers('app', 'key123', fetchImpl);
    expect(res).toEqual({
      ok: true,
      results: [
        { symbol: 'AAPL', description: 'Apple Inc.', exchange: null, type: 'Common Stock' },
        { symbol: 'APPF', description: 'AppFolio Inc.', exchange: null, type: 'Common Stock' },
        { symbol: 'VNM.HM', description: 'Vinamilk', exchange: 'HM', type: 'Common Stock' },
      ],
    });
  });

  it('parses no exchange for a symbol without a dot', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      ok({
        count: 1,
        result: [{ symbol: 'AAPL', description: 'Apple Inc.', displaySymbol: 'AAPL', type: 'Common Stock' }],
      }),
    );
    const res = await searchTickers('aapl', 'key123', fetchImpl);
    expect(res.ok && res.results[0].exchange).toBeNull();
  });

  it('parses the suffix after the last dot as the exchange', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      ok({
        count: 1,
        result: [{ symbol: 'VNM.HM', description: 'Vinamilk', displaySymbol: 'VNM.HM', type: 'Common Stock' }],
      }),
    );
    const res = await searchTickers('vnm', 'key123', fetchImpl);
    expect(res.ok && res.results[0].exchange).toBe('HM');
  });

  it('returns network error when fetch rejects', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('boom'));
    const res = await searchTickers('aapl', 'key123', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'network' });
  });

  it('returns rate-limited on HTTP 429', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fail(429));
    const res = await searchTickers('aapl', 'key123', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'rate-limited' });
  });

  it('returns invalid-key on HTTP 401', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fail(401));
    const res = await searchTickers('aapl', 'badkey', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'invalid-key' });
  });

  it('returns invalid-key on HTTP 403', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fail(403));
    const res = await searchTickers('aapl', 'badkey', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'invalid-key' });
  });

  it('returns network error on other non-OK statuses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fail(500));
    const res = await searchTickers('aapl', 'key123', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'network' });
  });
});

describe('fetchQuote', () => {
  it('returns no-key error when apiKey is empty', async () => {
    const fetchImpl = vi.fn();
    const res = await fetchQuote('AAPL', '', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'no-key' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns quote: null for an empty symbol without calling fetch', async () => {
    const fetchImpl = vi.fn();
    const res = await fetchQuote('   ', 'key123', fetchImpl);
    expect(res).toEqual({ ok: true, quote: null });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps a successful response into TickerQuote shape', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      ok({ c: 185.42, d: 2.25, dp: 1.23, h: 186, l: 184, o: 184.5, pc: 183.17, t: 1716220800 }),
    );
    const res = await fetchQuote('AAPL', 'key123', fetchImpl);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.quote).not.toBeNull();
      expect(res.quote?.currentPrice).toBe(185.42);
      expect(res.quote?.percentChange).toBe(1.23);
      expect(typeof res.quote?.fetchedAt).toBe('string');
    }
  });

  it('returns quote: null when Finnhub reports c=0 and pc=0 (unknown symbol)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      ok({ c: 0, d: null, dp: null, h: 0, l: 0, o: 0, pc: 0, t: 0 }),
    );
    const res = await fetchQuote('NOPE', 'key123', fetchImpl);
    expect(res).toEqual({ ok: true, quote: null });
  });

  it('returns invalid-key on HTTP 401', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fail(401));
    const res = await fetchQuote('AAPL', 'badkey', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'invalid-key' });
  });

  it('returns rate-limited on HTTP 429', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fail(429));
    const res = await fetchQuote('AAPL', 'key123', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'rate-limited' });
  });

  it('returns network error when fetch rejects', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('boom'));
    const res = await fetchQuote('AAPL', 'key123', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'network' });
  });
});
